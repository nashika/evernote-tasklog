import request = require("superagent");
import _ = require("lodash");
import {injectable} from "inversify";

import {BaseClientService} from "./base-client-service";
import {BaseEntity} from "../../common/entity/base-entity";
import {BaseMultiEntity, IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";
import {NoteEntity} from "../../common/entity/note-entity";
import {GlobalUserEntity} from "../../common/entity/global-user-entity";

@injectable()
export class RequestService extends BaseClientService {

  public find<T extends BaseMultiEntity>(EntityClass: typeof BaseMultiEntity, query: Object = {}, limit?: number, sort?: {[key: string]: number}|string): Promise<T[]> {
    let options: IMultiEntityFindOptions = {};
    options.query = query;
    options.limit = limit;
    options.sort = sort;
    return request.post(`/${_.kebabCase(EntityClass.params.name)}`).send(options).then(res => {
      return _.map(res.body, doc => new (<any>EntityClass)(doc));
    });
  }

  public findOne<T extends BaseEntity>(EntityClass: typeof BaseEntity, query: Object = {}): Promise<T> {
    return request.post(`/${_.kebabCase(EntityClass.params.name)}`).send(query).then(res => {
      return new (<any>EntityClass)(res.body);
    });
  }

  public count(EntityClass: typeof BaseMultiEntity, query: Object = {}): Promise<number> {
    return request.post(`/${_.kebabCase(EntityClass.params.name)}/count`).send(query).then(res => {
      let count: number = res.body;
      return count;
    });
  }

  public save<T extends BaseEntity>(EntityClass: typeof BaseEntity, entity: T): Promise<void> {
    return request.post(`/${_.kebabCase(EntityClass.params.name)}/save`).send(entity).then(() => {
    });
  }

  public sync(): Promise<void> {
    return request.post(`/sync`).then(_res => {
    });
  }

  public getUpdateCount(): Promise<number> {
    return request.post(`/sync/update-count`).then(res => _.toInteger(res.body));
  }

  public getContentNote(guid: string): Promise<NoteEntity> {
    return request.post(`/note/get-content`).send({guid: guid}).then(res => {
      return res.body ? new NoteEntity(res.body) : null;
    });
  }

  public reParseNote(): Promise<void> {
    return request.post(`/note/re-parse`).then(_res => {
    });
  }

  public loadAuth(): Promise<GlobalUserEntity> {
    return request.post(`/global-user/load`).then(res => {
      return res.body ? new GlobalUserEntity(res.body) : null;
    });
  }

  public changeAuth(globalUser: GlobalUserEntity): Promise<void> {
    return request.post("/global-user/change").send(globalUser).then(_res => null);
  }

  public tokenAuth(sandbox: boolean, token: string): Promise<GlobalUserEntity> {
    if (!token) return Promise.reject<GlobalUserEntity>("No Token");
    return request.post(`/global-user/auth`).send({sandbox: sandbox, token: token}).then(res => {
      return new GlobalUserEntity(res.body);
    });
  }

  public logoutAuth(): Promise<void> {
    return request.post(`/global-user/logout`).then(_res => null);
  }

}
