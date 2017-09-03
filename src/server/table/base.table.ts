import _ = require("lodash");
import {injectable} from "inversify";
import {getLogger} from "log4js";
import sequelize = require("sequelize");

import {
  BaseEntity, IDestroyEntityOptions, ICountEntityOptions,
  IFindEntityOptions
} from "../../common/entity/base.entity";
import {container} from "../inversify.config";

let logger = getLogger("system");

export interface ISequelizeInstance<T extends BaseEntity> extends sequelize.Instance<T> {
}

export interface ISequelizeModel<T extends BaseEntity> extends sequelize.Model<ISequelizeInstance<T>, T> {
}

export interface IBaseTableParams {
  fields: sequelize.DefineAttributes,
  options: sequelize.DefineOptions<ISequelizeInstance<BaseEntity>>,
  jsonFields: string[],
}

@injectable()
export abstract class BaseTable<T extends BaseEntity> {

  static params: IBaseTableParams;

  EntityClass: typeof BaseEntity;

  protected name: string;
  protected archiveName: string;
  protected archiveFields: sequelize.DefineAttributes;
  protected archiveOptions: sequelize.DefineOptions<ISequelizeInstance<T>>;
  protected sequelizeDatabase: sequelize.Sequelize;
  protected sequelizeModel: ISequelizeModel<T> = null;
  protected archiveSequelizeModel: ISequelizeModel<T> = null;

  get Class(): typeof BaseTable {
    return <typeof BaseTable>this.constructor;
  }

  constructor() {
    this.name = _.lowerFirst(_.replace(this.Class.name, /Table$/, ""));
    this.EntityClass = <any>container.getNamed(BaseEntity, this.name);
  }

  initialize(database: sequelize.Sequelize) {
   this.sequelizeDatabase = database;
    this.sequelizeModel = this.sequelizeDatabase.define<ISequelizeInstance<T>, T>(this.name, this.Class.params.fields, this.Class.params.options);
    if (this.EntityClass.params.archive) {
      this.archiveName = "archive" + _.upperFirst(this.name);
      this.archiveFields = {};
      this.archiveFields["archiveId"] = {type: sequelize.INTEGER, primaryKey: true, autoIncrement: true};
      let addIndexes: sequelize.DefineIndexesOptions[] = [];
      _.each(this.Class.params.fields, (field: sequelize.DefineAttributeColumnOptions, name) => {
        field = _.cloneDeep(field);
        if (field.primaryKey || field.unique)
          addIndexes.push({unique: false, fields: [name]});
        field.primaryKey = false;
        field.unique = false;
        this.archiveFields[name] = field;
      });
      this.archiveOptions = _.cloneDeep(this.Class.params.options);
      this.archiveOptions.indexes = _.union(addIndexes, this.archiveOptions.indexes);
      this.archiveSequelizeModel = this.sequelizeDatabase.define<ISequelizeInstance<T>, T>(this.archiveName, this.archiveFields, this.archiveOptions);
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
