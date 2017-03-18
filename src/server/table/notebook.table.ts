import {injectable} from "inversify";
import sequelize = require("sequelize");

import {NotebookEntity} from "../../common/entity/notebook.entity";
import {BaseMultiEvernoteTable} from "./base-multi-evernote.table";
import {ISequelizeInstance} from "./base.table";

@injectable()
export class NotebookTable extends BaseMultiEvernoteTable<NotebookEntity> {

  protected fields: sequelize.DefineAttributes = {
    guid: {type: sequelize.STRING, allowNull: false},
    name: {type: sequelize.STRING, allowNull: false},
    updateSequenceNum: {type: sequelize.INTEGER, allowNull: false},
    defaultNotebook: {type: sequelize.BOOLEAN, allowNull: false},
    stack: {type: sequelize.STRING, allowNull: true},
  };

  protected options: sequelize.DefineOptions<ISequelizeInstance<NotebookEntity>> = {
    indexes: [],
  };

}
