import _ = require("lodash");
import {injectable} from "inversify";
import {getLogger} from "log4js";
import sequelize = require("sequelize");

import {BaseEntity} from "../../common/entity/base.entity";
import {container} from "../inversify.config";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";

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
  protected globalUser: GlobalUserEntity;
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

  initialize(database: sequelize.Sequelize, globalUser: GlobalUserEntity = null) {
    if (this.EntityClass.params.requireUser && !globalUser) {
      throw Error(`need username.`);
    }
    this.globalUser = globalUser;
    this.sequelizeDatabase = database;
    this.sequelizeModel = this.sequelizeDatabase.define<ISequelizeInstance<T>, T>(this.name, this.Class.params.fields, this.Class.params.options);
    if (this.EntityClass.params.archive) {
      this.archiveName = "archive" + _.upperFirst(this.name);
      this.archiveFields = {};
      this.archiveFields["archiveId"] = {type: sequelize.INTEGER, primaryKey: true};
      let addIndexes: sequelize.DefineIndexesOptions[] = [];
      _.each(this.Class.params.fields, (field: sequelize.DefineAttributeColumnOptions, name) => {
        field = _.cloneDeep(field);
        field.primaryKey = false;
        field.unique = false;
        if (field.primaryKey || field.unique)
          addIndexes.push({unique: false, fields: [name]});
        this.archiveFields[name] = field;
      });
      this.archiveOptions = _.cloneDeep(this.Class.params.options);
      this.archiveOptions.indexes = _.union(addIndexes, this.archiveOptions.indexes);
      this.archiveSequelizeModel = this.sequelizeDatabase.define<ISequelizeInstance<T>, T>(this.archiveName, this.archiveFields, this.archiveOptions);
    }
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
      data[jsonField] = JSON.parse(data[jsonField]);
    }
    return new (<any>this.EntityClass)(data);
  }

}
