import _ = require("lodash");
import * as sequelize from "sequelize";

import {BaseTable} from "./base.table";
import {BaseEvernoteEntity} from "../../common/entity/base-evernote.entity";

export class BaseEvernoteTable<T extends BaseEvernoteEntity> extends BaseTable<T> {

  async removeByGuid(query: string|string[]): Promise<void> {
    if (!query) return;
    let where: sequelize.WhereOptions<any>;
    if (_.isArray(query)) {
      if (_.size(query) == 0) return;
      where = {guid: {$in: query}};
    } else if (_.isString(query)) {
      where = {guid: query};
    }
    await this.remove({where: where});
  }

}
