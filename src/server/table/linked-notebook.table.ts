import {injectable} from "inversify";
import sequelize = require("sequelize");

import {LinkedNotebookEntity} from "../../common/entity/linked-notebook.entity";
import {BaseMultiEvernoteTable} from "./base-multi-evernote.table";
import {IBaseTableParams} from "./base.table";

@injectable()
export class LinkedNotebookTable extends BaseMultiEvernoteTable<LinkedNotebookEntity> {

  static params: IBaseTableParams = {
    fields: {
      guid: {type: sequelize.STRING, allowNull: false},
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
