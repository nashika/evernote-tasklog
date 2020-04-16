import _ from "lodash";
import {
  EntitySchema,
  EntitySchemaIndexOptions,
  FindConditions,
  getRepository,
  Repository,
} from "typeorm";
import { EntitySchemaOptions } from "typeorm/entity-schema/EntitySchemaOptions";
import { injectable } from "inversify";

import { SYMBOL_TABLES, SYMBOL_TYPES } from "~/src/common/symbols";
import BaseEntity, {
  IFindManyEntityOptions,
  IFindOneEntityOptions,
} from "~/src/common/entity/base.entity";
import container from "~/src/server/inversify.config";
import { UNSET_ERROR } from "~/src/common/errors";
import logger from "~/src/server/logger";

@injectable()
export default abstract class BaseTable<T extends BaseEntity> {
  protected static readonly schemaOptions: EntitySchemaOptions<
    BaseEntity
  > | null = null;

  protected readonly jsonFields: string[] = [];

  readonly EntityClass: typeof BaseEntity;
  readonly name: string;
  readonly archiveName?: string;

  readonly schema: EntitySchema<T>;
  readonly archiveSchema: EntitySchema<T> | null = null;

  private _repository: Repository<T> | null = null;
  private archiveRepository: Repository<T> | null = null;

  get Class(): typeof BaseTable {
    return <typeof BaseTable>this.constructor;
  }

  get repository(): Repository<T> {
    if (!this._repository) throw UNSET_ERROR;
    return this._repository;
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
    if (!this.Class.schemaOptions)
      throw new Error("schemaOptionsが指定されていません");
    this.schema = new EntitySchema(this.Class.schemaOptions);
    if (this.EntityClass.params.archive) {
      const archiveSchemaOptions: EntitySchemaOptions<T> = _.clone(
        this.Class.schemaOptions
      );
      const addIndexes: EntitySchemaIndexOptions[] = [];
      archiveSchemaOptions.columns = {};
      archiveSchemaOptions.columns.archiveId = {
        type: "int",
        primary: true,
        generated: true,
      };
      _.each(this.Class.schemaOptions.columns, (column, name) => {
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
        this.Class.schemaOptions.indices
      );
      this.archiveSchema = new EntitySchema(archiveSchemaOptions);
    }
  }

  initialize() {
    this._repository = getRepository(this.schema);
    if (this.archiveSchema)
      this.archiveRepository = getRepository(this.archiveSchema);
  }

  async findOne(options: IFindOneEntityOptions<T> = {}): Promise<T | null> {
    options = this.parseFindOptions(options);
    this.message("find", ["local"], this.EntityClass.params.name, true, {
      query: options,
    });
    const data: Partial<T> | undefined = await this.repository.findOne(options);
    this.message("find", ["local"], this.EntityClass.params.name, false, {
      query: options,
    });
    return data ? this.prepareLoadEntity(data) : null;
  }

  async findByPrimary(primaryKey: number | string): Promise<T | null> {
    return this.findOne({
      where: { [this.EntityClass.params.primaryKey]: primaryKey },
    });
  }

  async findAll(options: IFindManyEntityOptions<T> = {}): Promise<T[]> {
    options = this.parseFindOptions(options);
    const repository = this.chooseRepository(options);
    this.message("find", ["local"], this.EntityClass.params.name, true, {
      options,
    });
    const datas: Partial<T>[] = await repository.find(options);
    this.message("find", ["local"], this.EntityClass.params.name, false, {
      length: datas.length,
      options,
    });
    return _.map(datas, data => this.prepareLoadEntity(data));
  }

  async count(options: IFindManyEntityOptions<T> = {}): Promise<number> {
    options = this.parseFindOptions(options);
    const repository = this.chooseRepository(options);
    this.message(
      "count",
      ["local"],
      this.EntityClass.params.name,
      true,
      options
    );
    const count = await repository.count(options);
    this.message("count", ["local"], this.EntityClass.params.name, false, {
      count,
    });
    return count;
  }

  private chooseRepository(options: { archive?: boolean }): Repository<T> {
    const repository = options.archive
      ? this.archiveRepository
      : this.repository;
    if (!repository) throw UNSET_ERROR;
    return repository;
  }

  private parseFindOptions(
    options: IFindManyEntityOptions<T> = {}
  ): IFindManyEntityOptions<T> {
    options.where =
      options.where || _.clone(this.EntityClass.params.default.where);
    options.where = _.merge(
      options.where || {},
      this.EntityClass.params.append.where || {}
    );
    options.order =
      options.order || _.clone(this.EntityClass.params.default.order);
    _.merge(options.order || {}, this.EntityClass.params.append.order || {});
    return options;
  }

  async save(entity: T, archive: boolean = false): Promise<T | null> {
    if (!entity) return null;
    const savedEntities = await this.saveAll([entity], archive);
    return savedEntities.length === 0 ? null : savedEntities[0];
  }

  async saveAll(entities: T[], archive: boolean = false): Promise<T[]> {
    if (!entities || entities.length === 0) return [];
    this.message("save", ["local"], this.EntityClass.params.name, true, {
      count: entities.length,
      entities: entities.map(entity =>
        _.pick(entity, ["primaryKey", "displayField"])
      ),
    });
    const saveDatas = _.map(entities, entity => this.prepareSaveEntity(entity));
    const savedDatas: Partial<T>[] = await this.repository.save(saveDatas);
    const savedEntities = _.map(savedDatas, savedData =>
      this.prepareLoadEntity(savedData)
    );
    this.message("save", ["local"], this.EntityClass.params.name, false, {
      count: entities.length,
      entities: savedEntities.map(savedEntity =>
        _.pick(savedEntity, ["primaryKey", "displayField"])
      ),
    });
    if (archive && this.archiveRepository) {
      this.message(
        "save",
        ["local", "archive"],
        this.EntityClass.params.name,
        true,
        {
          count: savedDatas.length,
          entities: savedDatas.map(savedData =>
            _.pick(savedData, ["primaryKey", "displayField"])
          ),
        }
      );
      const savedArchiveDatas = await this.archiveRepository.create(saveDatas);
      this.message(
        "save",
        ["local", "archive"],
        this.EntityClass.params.name,
        false,
        {
          count: savedArchiveDatas.length,
          entities: savedArchiveDatas.map(data =>
            _.pick(data, ["primaryKey", "displayField"])
          ),
        }
      );
    }
    return savedEntities;
  }

  async delete(criteria: number | string | FindConditions<T>): Promise<void> {
    if (!criteria) return;
    this.message("remove", ["local"], this.EntityClass.params.name, true, {
      criteria,
    });
    const numRemoved = await this.repository.delete(criteria);
    this.message("remove", ["local"], this.EntityClass.params.name, false, {
      criteria,
      numRemoved,
    });
  }

  protected message(
    action: string,
    options: string[],
    name: string,
    isStart: boolean,
    dispData: Object | null = null
  ) {
    const message = `${_.startCase(action)} ${_.join(
      options,
      " "
    )} ${name} was ${isStart ? "started" : "finished"}. ${
      dispData ? " " + JSON.stringify(dispData) : ""
    }`;
    logger.trace(message);
  }

  protected prepareSaveEntity(entity: T): Partial<T> {
    const data: Partial<T> = _.clone(entity);
    for (const jsonField of this.jsonFields) {
      _.set(data, jsonField, JSON.stringify(_.get(entity, jsonField)));
    }
    return data;
  }

  protected prepareLoadEntity(data: Partial<T>): T {
    for (const jsonField of this.jsonFields) {
      const json = _.get(data, jsonField);
      _.set(
        data,
        jsonField,
        typeof json === "string" ? JSON.parse(json) : null
      );
    }
    return new (<any>this.EntityClass)(data);
  }
}
