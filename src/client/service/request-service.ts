import request = require("superagent");
import _ = require("lodash");
import {injectable} from "inversify";

import {BaseClientService} from "./base-client-service";
import {BaseEntity} from "../../common/entity/base-entity";
import {BaseMultiEntity, IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";
import {NoteEntity} from "../../common/entity/note-entity";
import {AuthEntity} from "../../common/entity/auth-entity";

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

  public count<T extends BaseMultiEntity>(EntityClass: typeof BaseMultiEntity, query: Object = {}): Promise<number> {
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
    return request.post(`/sync`).then(req => {
    });
  }

  public getContentNote(guid: string): Promise<NoteEntity[]> {
    return request.post(`/note/get-content`).send({guid: guid}).then(res => {
      return _.map(res.body, doc => new NoteEntity(doc));
    });
  }

  public reParseNote(): Promise<void> {
    return request.post(`/note/re-parse`).then(req => {
    });
  }

  public loadAuth(): Promise<AuthEntity> {
    return request.post(`/auth`).then(req => {
      return req.body ? new AuthEntity(req.body) : null;
    });
  }

  public tokenAuth(sandbox: boolean, token?: string): Promise<AuthEntity> {
    return request.post(`/auth/token`).send({sandbox: sandbox, token: token}).then(req => {
      return new AuthEntity(req.body);
    });
  }

  public loginAuth(sandbox: boolean, useToken: boolean): Promise<void> {
    return request.post(`/auth/login`).send({sandbox: sandbox, token: useToken}).then(req => null);
  }

  public logoutAuth(): Promise<void> {
    return request.post(`/auth/logout`).then(req => null);
  }

}
