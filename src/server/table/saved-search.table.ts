import {injectable} from "inversify";
import * as sequelize from "sequelize";

import {SavedSearchEntity} from "../../common/entity/saved-search.entity";
import {BaseEvernoteTable} from "./base-evernote.table";
import {IBaseTableParams} from "./base.table";

@injectable()
export class SavedSearchTable extends BaseEvernoteTable<SavedSearchEntity> {

  params: IBaseTableParams<SavedSearchEntity> = {
    fields: {
      guid: {type: sequelize.STRING, primaryKey: true},
      name: {type: sequelize.STRING, allowNull: false},
      query: {type: sequelize.STRING},
      format: {type: sequelize.INTEGER},
      updateSequenceNum: {type: sequelize.INTEGER, allowNull: false},
      scope: {type: sequelize.TEXT},
    },
    options: {
      indexes: [],
    },
    jsonFields: ["scope"],
  };

}
