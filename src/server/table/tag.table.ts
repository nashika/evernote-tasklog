import {injectable} from "inversify";
import sequelize = require("sequelize");

import {TagEntity} from "../../common/entity/tag.entity";
import {BaseMultiEvernoteTable} from "./base-multi-evernote.table";
import {ISequelizeInstance} from "./base.table";

@injectable()
export class TagTable extends BaseMultiEvernoteTable<TagEntity> {

  protected fields: sequelize.DefineAttributes = {
    guid: {type: sequelize.STRING, allowNull: false},
    name: {type: sequelize.STRING, allowNull: false},
    parentGuid: {type: sequelize.STRING, allowNull: true},
    updateSequenceNum: {type: sequelize.INTEGER, allowNull: false},
  };

  protected options: sequelize.DefineOptions<ISequelizeInstance<TagEntity>> = {
    indexes: [],
  };

}
