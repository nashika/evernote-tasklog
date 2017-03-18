import {injectable} from "inversify";
import sequelize = require("sequelize");

import {SearchEntity} from "../../common/entity/serch.entity";
import {BaseMultiEvernoteTable} from "./base-multi-evernote.table";
import {ISequelizeInstance} from "./base.table";

@injectable()
export class SearchTable extends BaseMultiEvernoteTable<SearchEntity> {

  protected fields: sequelize.DefineAttributes = {
  };

  protected options: sequelize.DefineOptions<ISequelizeInstance<SearchEntity>> = {
    indexes: [],
  };

}
