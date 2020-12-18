import _ from "lodash";
import {
  Between,
  EntitySchema,
  EntitySchemaColumnOptions,
  EntitySchemaIndexOptions,
  Equal,
  FindConditions,
  FindManyOptions,
  getRepository,
  In,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from "typeorm";
import { EntitySchemaOptions } from "typeorm/entity-schema/EntitySchemaOptions";
import { injectable } from "inversify";

import { SYMBOL_TABLES, SYMBOL_TYPES } from "~/src/common/symbols";
import BaseEntity, {
  TEntityClass,
  EntityColumnType,
  FindEntityWhereColumnOperators,
  FindEntityWhereOptions,
  FindManyEntityOptions,
  FindOneEntityOptions,
  EntityToInterface,
} from "~/src/common/entity/base.entity";
import container from "~/src/server/inversify.config";
import logger from "~/src/server/logger";
import { assertIsDefined } from "~/src/common/util/assert";

@injectable()
export default abstract class BaseTable<T extends BaseEntity> {
  readonly EntityClass: TEntityClass<T>;

  readonly schema: EntitySchema<EntityToInterface<T>>;
  readonly archiveSchema: EntitySchema<EntityToInterface<T>> | null = null;

  private _repository: Repository<EntityToInterface<T>> | null = null;
  private archiveRepository: Repository<EntityToInterface<T>> | null = null;

  get Class(): typeof BaseTable {
    return <typeof BaseTable>this.constructor;
  }

  get repository(): Repository<EntityToInterface<T>> {
    assertIsDefined(this._repository);
    return this._repository;
  }

  constructor() {
    const name = _.lowerFirst(_.replace(this.Class.name, /Table$/, ""));
    this.EntityClass = container.getNamed(
      SYMBOL_TYPES.Entity,
      _.get(SYMBOL_TABLES, name)
    );
    const schemaOptions = this.makeSchemaOptions();
    this.schema = new EntitySchema(schemaOptions);
    if (this.EntityClass.params.archive) {
      const archiveSchemaOptions: EntitySchemaOptions<T> = _.clone(
        schemaOptions
      );
      archiveSchemaOptions.name = "archive" + _.upperFirst(name);
      const addIndexes: EntitySchemaIndexOptions[] = [];
      archiveSchemaOptions.columns = {};
      archiveSchemaOptions.columns.archiveId = {
        type: "int",
        primary: true,
        generated: true,
      };
      _.each(schemaOptions.columns, (column, name) => {
        const addColumn = _.clone(column);
        if (!addColumn) return;
        if (addColumn.primary || addColumn.unique)
          addIndexes.push({
            name:
              _.snakeCase(archiveSchemaOptions.name) +
              "_" +
              _.snakeCase(addColumn.name),
            unique: false,
            columns: [name],
          });
        addColumn.primary = false;
        addColumn.unique = false;
        _.set(archiveSchemaOptions.columns, name, addColumn);
      });
      archiveSchemaOptions.indices = _.union(addIndexes, schemaOptions.indices);
      this.archiveSchema = new EntitySchema(archiveSchemaOptions);
    }
  }

  private makeSchemaOptions(): EntitySchemaOptions<T> {
    return {
      name: this.EntityClass.params.name,
      columns: {
        ..._.mapValues(
          this.EntityClass.params.columns,
          (column, name): EntitySchemaColumnOptions => {
            assertIsDefined(column);
            return {
              name,
              type: this.makeSchemaColumnType(column.type),
              primary: column.primary,
              generated: column.generated,
              nullable: column.nullable,
            };
          }
        ),
        createdAt: {
          type: "datetime",
          createDate: true,
        },
        updatedAt: {
          type: "datetime",
          updateDate: true,
        },
      },
      indices: this.EntityClass.params.indicies?.map((index) => ({
        name:
          _.snakeCase(this.EntityClass.params.name) +
          "_" +
          _.snakeCase(index.name),
        columns: index.columns,
        unique: index.unique,
      })),
    };
  }

  private makeSchemaColumnType(
    type: EntityColumnType
  ): EntitySchemaColumnOptions["type"] {
    if (type === "string") return "text";
    return type;
  }

  initialize() {
    this._repository = getRepository(this.schema);
    if (this.archiveSchema)
      this.archiveRepository = getRepository(this.archiveSchema);
  }

  async findOne(argOptions: FindOneEntityOptions<T> = {}): Promise<T | null> {
    this.message("find", ["local"], this.EntityClass.params.name, true, {
      query: argOptions,
    });
    const options = this.parseFindOptions(argOptions);
    const data:
      | Partial<EntityToInterface<T>>
      | undefined = await this.repository.findOne(options);
    this.message("find", ["local"], this.EntityClass.params.name, false, {
      query: argOptions,
    });
    return data ? this.prepareLoadEntity(data) : null;
  }

  async findByPrimary(primaryKey: number | string): Promise<T | null> {
    return this.findOne({
      where: <any>{ [this.EntityClass.params.primaryKey]: primaryKey },
    });
  }

  async findAll(argOptions: FindManyEntityOptions<T> = {}): Promise<T[]> {
    const repository = this.chooseRepository(argOptions);
    this.message("find", ["local"], this.EntityClass.params.name, true, {
      query: argOptions,
    });
    const options = this.parseFindOptions(argOptions);
    const datas: Partial<EntityToInterface<T>>[] = await repository.find(
      options
    );
    this.message("find", ["local"], this.EntityClass.params.name, false, {
      length: datas.length,
      query: argOptions,
    });
    return _.map(datas, (data) => this.prepareLoadEntity(data));
  }

  async count(argOptions: FindManyEntityOptions<T> = {}): Promise<number> {
    const repository = this.chooseRepository(argOptions);
    this.message("count", ["local"], this.EntityClass.params.name, true, {
      query: argOptions,
    });
    const options = this.parseFindOptions(argOptions);
    const count = await repository.count(options);
    this.message("count", ["local"], this.EntityClass.params.name, false, {
      count,
      query: argOptions,
    });
    return count;
  }

  private chooseRepository(options: {
    archive?: boolean;
  }): Repository<EntityToInterface<T>> {
    const repository = options.archive
      ? this.archiveRepository
      : this.repository;
    assertIsDefined(repository);
    return repository;
  }

  private parseFindOptions(
    argOptions: FindManyEntityOptions<T> = {}
  ): FindManyOptions<EntityToInterface<T>> {
    argOptions.where =
      argOptions.where ?? _.clone(this.EntityClass.params.default.where);
    argOptions.where = _.merge(
      argOptions.where || {},
      this.EntityClass.params.append.where || {}
    );
    argOptions.order =
      argOptions.order || _.clone(this.EntityClass.params.default.order);
    _.merge(argOptions.order || {}, this.EntityClass.params.append.order || {});
    // TODO: $gte等を処理する機能を組み込む
    const options: FindManyOptions<EntityToInterface<T>> = {
      where: this.parseFindWhereOptions(argOptions.where),
      order: argOptions.order,
      take: argOptions.take,
      skip: argOptions.skip,
    };
    return options;
  }

  private parseFindWhereOptions(
    where: FindEntityWhereOptions<T> | undefined
  ): FindConditions<EntityToInterface<T>> | undefined {
    if (where === undefined) return undefined;
    const result: FindConditions<T> = {};
    for (const key in where) {
      const whereColumn = where[key];
      if (whereColumn === undefined) continue;
      else if (whereColumn === null) {
        result[key] = <T[keyof T]>null;
        continue;
      } else if (typeof whereColumn !== "object") {
        result[key] = <T[keyof T]>whereColumn;
        continue;
      }
      const wc: FindEntityWhereColumnOperators<T[keyof T]> = whereColumn ?? {};
      // TODO: 型変換が上手くいっていないのでanyにしている
      if (wc.$eq !== undefined) result[key] = <any>Equal(wc.$eq);
      else if (wc.$ne !== undefined) result[key] = <any>Not(wc.$ne);
      else if (wc.$gt !== undefined) result[key] = <any>MoreThan(wc.$gt);
      else if (wc.$gte !== undefined)
        result[key] = <any>MoreThanOrEqual(wc.$gte);
      else if (wc.$lt !== undefined) result[key] = <any>LessThan(wc.$lt);
      else if (wc.$lte !== undefined)
        result[key] = <any>LessThanOrEqual(wc.$lte);
      else if (wc.$between !== undefined)
        result[key] = <any>Between(wc.$between[0], wc.$between[1]);
      else if (wc.$in !== undefined) result[key] = <any>In(wc.$in);
    }
    return result;
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
      entities: entities.map((entity) =>
        _.pick(entity, ["primaryKey", "displayField"])
      ),
    });
    const saveDatas = _.map(entities, (entity) =>
      this.prepareSaveEntity(entity)
    );
    const savedDatas: Partial<T>[] = await this.repository.save(saveDatas);
    const savedEntities = _.map(savedDatas, (savedData) =>
      this.prepareLoadEntity(savedData)
    );
    this.message("save", ["local"], this.EntityClass.params.name, false, {
      count: entities.length,
      entities: savedEntities.map((savedEntity) =>
        _.pick(savedEntity, ["primaryKey", "displayField"])
      ),
    });
    if (archive && this.archiveRepository) {
      this.message(
        "insert",
        ["local", "archive"],
        this.EntityClass.params.name,
        true,
        {
          count: savedDatas.length,
          entities: savedDatas.map((savedData) =>
            _.pick(savedData, ["primaryKey", "displayField"])
          ),
        }
      );
      const insertResult = await this.archiveRepository.insert(saveDatas);
      this.message(
        "insert",
        ["local", "archive"],
        this.EntityClass.params.name,
        false,
        {
          count: insertResult.identifiers.length,
          entities: insertResult.identifiers,
        }
      );
    }
    return savedEntities;
  }

  async delete(
    criteria: Parameters<Repository<EntityToInterface<T>>["delete"]>[0]
  ): Promise<void> {
    if (!criteria || (Array.isArray(criteria) && criteria.length === 0)) return;
    this.message("remove", ["local"], this.EntityClass.params.name, true, {
      criteria,
    });
    const deleteResult = await this.repository.delete(criteria);
    this.message("remove", ["local"], this.EntityClass.params.name, false, {
      criteria,
      deleteResult,
    });
  }

  async clear(): Promise<void> {
    this.message("clear", ["local"], this.EntityClass.params.name, true);
    await this.repository.clear();
    this.message("clear", ["local"], this.EntityClass.params.name, false);
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
    for (const jsonField of _.defaultTo(
      this.EntityClass.params.jsonFields,
      []
    )) {
      _.set(data, jsonField, JSON.stringify(_.get(entity, jsonField)));
    }
    return data;
  }

  protected prepareLoadEntity(data: Partial<EntityToInterface<T>>): T {
    for (const jsonField of _.defaultTo(
      this.EntityClass.params.jsonFields,
      []
    )) {
      const json = _.get(data, jsonField);
      _.set(
        data,
        jsonField,
        typeof json === "string" ? JSON.parse(json) : null
      );
    }
    return new this.EntityClass(data);
  }
}
