import {injectable} from "inversify";
import sequelize = require("sequelize");

import {LinkedNotebookEntity} from "../../common/entity/linked-notebook.entity";
import {BaseEvernoteTable} from "./base-evernote.table";
import {IBaseTableParams} from "./base.table";

@injectable()
export class LinkedNotebookTable extends BaseEvernoteTable<LinkedNotebookEntity> {

  static params: IBaseTableParams = {
    fields: {
      guid: {type: sequelize.STRING, primaryKey: true},
      shareName: {type: sequelize.STRING},
      username: {type: sequelize.STRING},
      shareId: {type: sequelize.STRING},
      sharedNotebookGlobalId: {type: sequelize.STRING},
      uri: {type: sequelize.STRING},
      updateSequenceNum: {type: sequelize.INTEGER, allowNull: false},
      noteStoreUrl: {type: sequelize.STRING},
      webApiUrlPrefix: {type: sequelize.STRING},
      stack: {type: sequelize.STRING},
      businessId: {type: sequelize.INTEGER},
    },
    options: {
      indexes: [],
    },
    jsonFields: [],
  };

}
