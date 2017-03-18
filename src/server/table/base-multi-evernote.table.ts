import _ = require("lodash");

import {BaseMultiTable} from "./base-multi.table";
import {BaseMultiEvernoteEntity} from "../../common/entity/base-multi-evernote.entity";
import {IMyWhereEntityOptions} from "../../common/entity/base-multi.entity";

export class BaseMultiEvernoteTable<T extends BaseMultiEvernoteEntity> extends BaseMultiTable<T> {

  async removeByGuid(query: string|string[]): Promise<void> {
    if (!query) return;
    let where: IMyWhereEntityOptions;
    if (_.isArray(query)) {
      if (_.size(query) == 0) return;
      where = {guid: {$in: query}};
    } else if (_.isString(query)) {
      where = {guid: query};
    }
    await this.remove({where: where});
  }

}
