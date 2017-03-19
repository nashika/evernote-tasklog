import {injectable} from "inversify";
import sequelize = require("sequelize");

import {TagEntity} from "../../common/entity/tag.entity";
import {BaseMultiEvernoteTable} from "./base-multi-evernote.table";
import {IBaseTableParams} from "./base.table";

@injectable()
export class TagTable extends BaseMultiEvernoteTable<TagEntity> {

  static params: IBaseTableParams = {
    fields: {
      guid: {type: sequelize.STRING, primaryKey: true},
      name: {type: sequelize.STRING, allowNull: false},
      parentGuid: {type: sequelize.STRING, allowNull: true},
      updateSequenceNum: {type: sequelize.INTEGER, allowNull: false},
    },
    options: {
      indexes: [],
    },
    jsonFields: [],
  };

}
