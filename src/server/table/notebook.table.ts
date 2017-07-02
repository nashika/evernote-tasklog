import {injectable} from "inversify";
import sequelize = require("sequelize");

import {NotebookEntity} from "../../common/entity/notebook.entity";
import {BaseEvernoteTable} from "./base-evernote.table";
import {IBaseTableParams} from "./base.table";

@injectable()
export class NotebookTable extends BaseEvernoteTable<NotebookEntity> {

  static params: IBaseTableParams = {
    fields: {
      guid: {type: sequelize.STRING, primaryKey: true},
      name: {type: sequelize.STRING, allowNull: false},
      updateSequenceNum: {type: sequelize.INTEGER, allowNull: false},
      defaultNotebook: {type: sequelize.BOOLEAN, allowNull: false},
      serviceCreated: {type: sequelize.BIGINT},
      serviceUpdated: {type: sequelize.BIGINT},
      publishing: {type: sequelize.TEXT},
      published: {type: sequelize.BOOLEAN},
      stack: {type: sequelize.STRING},
      sharedNotebookIds: {type: sequelize.TEXT},
      sharedNotebooks: {type: sequelize.TEXT},
      businessNotebooks: {type: sequelize.TEXT},
      contact: {type: sequelize.TEXT},
      restrictions: {type: sequelize.TEXT},
      recipientSettings: {type: sequelize.TEXT},
    },
    options: {
      indexes: [],
    },
    jsonFields: ["publishing", "sharedNotebookIds", "sharedNotebooks", "businessNotebooks", "contact", "restrictions", "recipientSettings"],
  };

}
