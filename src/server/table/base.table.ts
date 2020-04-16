import _ from "lodash";
import {
  EntitySchema,
  EntitySchemaIndexOptions,
  getRepository,
  Repository,
} from "typeorm";
import { EntitySchemaOptions } from "typeorm/entity-schema/EntitySchemaOptions";

import { SYMBOL_TABLES, SYMBOL_TYPES } from "~/src/common/symbols";
import BaseEntity from "~/src/common/entity/base.entity";
import container from "~/src/server/inversify.config";

export interface IBaseTableParams {
  jsonFields: string[];
}

export default abstract class BaseTable<T extends BaseEntity> {
  protected abstract readonly schemaOptions: EntitySchemaOptions<T>;

  readonly EntityClass: typeof BaseEntity;
  readonly name: string;
  readonly archiveName?: string;

  private _schema: EntitySchema<T> | null = null;
  private _archiveSchema: EntitySchema<T> | null = null;

  protected repository: Repository<T> | null = null;
  protected archiveRepository: Repository<T> | null = null;

  get Class(): typeof BaseTable {
    return <typeof BaseTable>this.constructor;
  }

  get schema(): EntitySchema<T> | null {
    return this._schema;
  }

  get archiveSchema(): EntitySchema<T> | null {
    return this._archiveSchema;
  }

  constructor() {
    this.name = _.lowerFirst(_.replace(this.Class.name, /Table$/, ""));
    this.EntityClass = container.getNamed(
      SYMBOL_TYPES.Entity,
      _.get(SYMBOL_TABLES, this.name)
    );
    if (this.EntityClass.params.archive) {
      this.archiveName = "archive" + _.upperFirst(this.name);
    }
  }

  initialize() {
    this._schema = new EntitySchema(this.schemaOptions);
    this.repository = getRepository(this._schema);
    if (this.EntityClass.params.archive) {
      const archiveSchemaOptions: EntitySchemaOptions<T> = _.clone(
        this.schemaOptions
      );
      const addIndexes: EntitySchemaIndexOptions[] = [];
      archiveSchemaOptions.columns = {};
      archiveSchemaOptions.columns.archiveId = {
        type: "int",
        primary: true,
        generated: true,
      };
      _.each(this.schemaOptions.columns, (column, name) => {
        const addColumn = _.clone(column);
        if (!addColumn) return;
        if (addColumn.primary || addColumn.unique)
          addIndexes.push({ unique: false, columns: [name] });
        addColumn.primary = false;
        addColumn.unique = false;
        _.set(archiveSchemaOptions.columns, name, addColumn);
      });
      archiveSchemaOptions.indices = _.union(
        addIndexes,
        this.schemaOptions.indices
      );
      this._archiveSchema = new EntitySchema(archiveSchemaOptions);
      this.archiveRepository = getRepository(this._archiveSchema);
    }
  }

  async findOne(options: IFindEntityOptions<T> = {}): Promise<T> {
    options = this.parseFindOptions(options);
    this.message("find", ["local"], this.EntityClass.params.name, true, {query: options});
    let instance: ISequelizeInstance<T> = await this.sequelizeModel.findOne(options);
    this.message("find", ["local"], this.EntityClass.params.name, false, {query: options});
    return instance ? this.prepareLoadEntity(instance) : null;
  }

  async findByPrimary(primaryKey: number | string): Promise<T> {
    return await this.findOne(<any>{where: {[this.EntityClass.params.primaryKey]: primaryKey}});
  }

  async findAll(options: IFindEntityOptions<T> = null): Promise<T[]> {
    options = this.parseFindOptions(options);
    let model = options.archive ? this.archiveSequelizeModel : this.sequelizeModel;
    this.message("find", ["local"], this.EntityClass.params.name, true, {options: options});
    let instances: ISequelizeInstance<T>[] = await model.findAll(options);
    this.message("find", ["local"], this.EntityClass.params.name, false, {"length": instances.length, options: options});
    return _.map(instances, instance => this.prepareLoadEntity(instance));
  }

  async count(options: ICountEntityOptions = null): Promise<number> {
    options = this.parseCountOptions(options);
    let model = options.archive ? this.archiveSequelizeModel : this.sequelizeModel;
    this.message("count", ["local"], this.EntityClass.params.name, true, options);
    let count = await model.count(options);
    this.message("count", ["local"], this.EntityClass.params.name, false, {count: count});
    return count;
  }

  private parseFindOptions(options: IFindEntityOptions<T>): IFindEntityOptions<T> {
    options = options || {};
    options.where = options.where || _.cloneDeep(this.EntityClass.params.default.where);
    options.where = _.merge(options.where || {}, this.EntityClass.params.append.where || {});
    options.order = options.order || _.cloneDeep(this.EntityClass.params.default.order);
    options.order = _.concat(<any>(options.order || []), <any>(this.EntityClass.params.append.order || []));
    return options;
  }

  private parseCountOptions(options: ICountEntityOptions): ICountEntityOptions {
    options = options || {};
    options.where = options.where || _.cloneDeep(this.EntityClass.params.default.where);
    options.where = _.merge(options.where || {}, this.EntityClass.params.append.where || {});
    return options;
  }

  async save(entity: T, archive: boolean = false): Promise<T> {
    if (!entity) return null;
    this.message("save", ["local"], this.EntityClass.params.name, true, {primaryKey: entity.primaryKey, displayField: entity.displayField});
    let savedInstance: ISequelizeInstance<T>;
    let oldInstance: ISequelizeInstance<T>;
    if (entity.primaryKey) {
      oldInstance = await this.sequelizeModel.findByPrimary(entity.primaryKey);
    }
    savedInstance = await this.sequelizeModel.build(this.prepareSaveEntity(entity), {isNewRecord: !oldInstance}).save();
    let savedEntity = this.prepareLoadEntity(savedInstance);
    this.message("save", ["local"], this.EntityClass.params.name, false, {primaryKey: entity.primaryKey, displayField: entity.displayField});
    if (this.EntityClass.params.archive && archive) {
      this.message("save", ["local", "archive"], this.EntityClass.params.name, true, {primaryKey: entity.primaryKey, displayField: entity.displayField});
      await this.archiveSequelizeModel.create(this.prepareSaveEntity(savedEntity));
      this.message("save", ["local", "archive"], this.EntityClass.params.name, false, {primaryKey: entity.primaryKey, displayField: entity.displayField});
    }
    return savedEntity;
  }

  async saveAll(entities: T[]): Promise<T[]> {
    if (!entities || entities.length == 0) return [];
    this.message("saveAll", ["local"], this.EntityClass.params.name, true, {"count": entities.length});
    let saveEntities: T[] = [];
    for (let entity of entities)
      saveEntities.push(await this.save(entity));
    this.message("saveAll", ["local"], this.EntityClass.params.name, false, {"count": entities.length});
    return saveEntities;
  }

  async remove(options: IDestroyEntityOptions): Promise<void> {
    if (!options) return;
    this.message("remove", ["local"], this.EntityClass.params.name, true, {query: options});
    let numRemoved = await this.sequelizeModel.destroy(options);
    this.message("remove", ["local"], this.EntityClass.params.name, false, {query: options, numRemoved: numRemoved});
  }

  protected message(action: string, options: string[], name: string, isStart: boolean, dispData: Object = null) {
    let message = `${_.startCase(action)} ${_.join(options, " ")} ${name} was ${isStart ? "started" : "finished"}. ${dispData ? " " + JSON.stringify(dispData) : ""}`;
    logger.trace(message);
  }

  protected prepareSaveEntity(entity: T): any {
    let result: any = _.cloneDeep(entity);
    for (let jsonField of this.Class.params.jsonFields) {
      result[jsonField] = JSON.stringify(_.get(entity, jsonField));
    }
    return result;
  }

  protected prepareLoadEntity(instance: ISequelizeInstance<T>): T {
    let data: any = instance.toJSON();
    for (let jsonField of this.Class.params.jsonFields) {
      data[jsonField] = data[jsonField] ? JSON.parse(data[jsonField]) : null;
    }
    return new (<any>this.EntityClass)(data);
  }

}
