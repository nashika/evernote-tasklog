import {injectable} from "inversify";
import sequelize = require("sequelize");

import {NotebookEntity} from "../../common/entity/notebook.entity";
import {BaseMultiEvernoteTable} from "./base-multi-evernote.table";
import {IBaseTableParams} from "./base.table";

@injectable()
export class NotebookTable extends BaseMultiEvernoteTable<NotebookEntity> {

  static params: IBaseTableParams = {
    fields: {
      guid: {type: sequelize.STRING, primaryKey: true},
      name: {type: sequelize.STRING, allowNull: false},
      updateSequenceNum: {type: sequelize.INTEGER, allowNull: false},
      defaultNotebook: {type: sequelize.BOOLEAN, allowNull: false},
      stack: {type: sequelize.STRING, allowNull: true},
    },
    options: {
      indexes: [],
    },
    jsonFields: [],
  };

}
