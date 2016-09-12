import request = require("superagent");
import _ = require("lodash");

import {BaseService} from "./base-service";
import {BaseEntity} from "../../common/entity/base-entity";
import {BaseMultiEntity, IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";
import {NoteEntity} from "../../common/entity/note-entity";

export class EntityService extends BaseService {

  public find<T extends BaseMultiEntity>(EntityClass: typeof BaseMultiEntity, query: Object = {}, limit?: number, sort?: {[key: string]: number}|string): Promise<T[]> {
    let options: IMultiEntityFindOptions = {};
    options.query = query;
    options.limit = limit;
    options.sort = sort;
    return request.post(`/${EntityClass.params.name}`).send(options).then(res => {
      return _.map(res.body, doc => new (<any>EntityClass)(doc));
    });
  }

  public findOne<T extends BaseEntity>(EntityClass: typeof BaseEntity, query: Object = {}): Promise<T> {
    return request.post(`/${EntityClass.params.name}`).send(query).then(res => {
      return new (<any>EntityClass)(res.body);
    });
  }

  public count<T extends BaseMultiEntity>(EntityClass: typeof BaseMultiEntity, query: Object = {}): Promise<number> {
    return request.post(`/${EntityClass.params.name}/count`).send({query: query}).then(res => {
      let count: number = res.body;
      return count;
    });
  }

  public save<T extends BaseEntity>(EntityClass: typeof BaseEntity, entity: T): Promise<void> {
    return request.post(`/${EntityClass.params.name}/save`).send(entity).then(() => {
    });
  }

  public sync(): Promise<void> {
    return request.post(`/sync`).then(req => {
    });
  }

  public getNoteContent(guid: string): Promise<NoteEntity[]> {
    return request.post(`/notes/get-content`).send({query: {guid: guid}}).then(res => {
      return _.map(res.body, doc => new NoteEntity(doc));
    });
  }

  public reParseNote(): Promise<void> {
    return request.post(`/notes/re-parse`).then(req => {
    });
  }
}
