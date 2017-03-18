import _ = require("lodash");

import {BaseMultiTable} from "./base-multi.table";
import {BaseMultiEvernoteEntity} from "../../common/entity/base-multi-evernote.entity";
import {IMyWhereEntityOptions} from "../../common/entity/base-multi.entity";

export class BaseMultiEvernoteTable<T extends BaseMultiEvernoteEntity> extends BaseMultiTable<T> {

  async saveByGuid(entities: T|T[], archive: boolean = false): Promise<void> {
    if (!entities) return;
    let arrEntities: T[] = _.castArray(entities);
    if (arrEntities.length == 0) return;
    this.message("save", ["local"], this.EntityClass.params.name, true, {"docs.count": arrEntities.length});
    for (let entity of arrEntities) {
      this.message("upsert", ["local"], this.EntityClass.params.name, true, {guid: entity.guid, title:_.get(entity, this.EntityClass.params.titleField)});
      let oldEntity = await this.findOne({where: {guid: entity.guid}});
      if (oldEntity) entity.id = oldEntity.id;
      await this.sequelizeModel.upsert(entity);
      this.message("upsert", ["local"], this.EntityClass.params.name, false, {guid: entity.guid});
    }
    if (!this.EntityClass.params.archive || !archive) return;
    for (let entity of arrEntities) {
      this.message("upsert", ["local", "archive"], this.EntityClass.params.name, true, {guid: entity.guid, usn: entity.updateSequenceNum, title:_.get(entity, this.EntityClass.params.titleField)});
      entity.id = null;
      await this.archiveSequelizeModel.upsert(entity);
      this.message("upsert", ["local", "archive"], this.EntityClass.params.name, false, {guid: entity.guid});
    }
    this.message("save", ["local"], this.EntityClass.params.name, false, {"docs.count": arrEntities.length});
  }

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
