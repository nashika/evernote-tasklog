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

@injectable()
export abstract class BaseTable<T extends BaseEntity> {

  EntityClass: typeof BaseEntity;

  protected name: string;
  protected fields: sequelize.DefineAttributes;
  protected options: sequelize.DefineOptions<ISequelizeInstance<T>>;
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
    this.sequelizeModel = this.sequelizeDatabase.define<ISequelizeInstance<T>, T>(this.name, this.fields, this.options);
    if (this.EntityClass.params.archive) {
      this.archiveName = "archive" + _.upperFirst(this.name);
      this.archiveFields = {};
      this.archiveFields["originalId"] = {type: sequelize.INTEGER, allowNull: false, comment: "Original ID"};
      _.each(this.fields, (field, name) => this.archiveFields[name] = _.cloneDeep(field));
      this.archiveOptions = _.cloneDeep(this.options);
      this.archiveOptions.indexes = _.union([{unique: false, fields: ["originalId"]}], this.archiveOptions.indexes);
      this.archiveSequelizeModel = this.sequelizeDatabase.define<ISequelizeInstance<T>, T>(this.archiveName, this.archiveFields, this.archiveOptions);
    }
  }

  protected message(action: string, options: string[], name: string, isStart: boolean, dispData: Object = null) {
    let message = `${_.startCase(action)} ${_.join(options, " ")} ${name} was ${isStart ? "started" : "finished"}. ${dispData ? " " + JSON.stringify(dispData) : ""}`;
    logger.trace(message);
  }

}
