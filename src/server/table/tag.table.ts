import {injectable} from "inversify";
import sequelize = require("sequelize");

import {TagEntity} from "../../common/entity/tag.entity";
import {BaseEvernoteTable} from "./base-evernote.table";
import {IBaseTableParams} from "./base.table";

@injectable()
export class TagTable extends BaseEvernoteTable<TagEntity> {

  params: IBaseTableParams<TagEntity> = {
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
