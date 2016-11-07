import request = require("superagent");
import _ = require("lodash");
import {injectable} from "inversify";

import {BaseClientService} from "./base-client.service";
import {BaseEntity} from "../../common/entity/base.entity";
import {BaseMultiEntity, IMultiEntityFindOptions} from "../../common/entity/base-multi.entity";
import {NoteEntity} from "../../common/entity/note.entity";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";
import {BaseSingleEntity} from "../../common/entity/base-single.entity";

@injectable()
export class RequestService extends BaseClientService {

  public find<T extends BaseMultiEntity>(EntityClass: typeof BaseMultiEntity, options: IMultiEntityFindOptions = {}): Promise<T[]> {
    return request.post(`/${_.kebabCase(EntityClass.params.name)}`).send(options).then(res => {
      return _.map(res.body, doc => new (<any>EntityClass)(doc));
    });
  }

  public findOne<T extends BaseMultiEntity>(EntityClass: typeof BaseMultiEntity, options: IMultiEntityFindOptions = {}): Promise<T> {
    options.limit = 1;
    return request.post(`/${_.kebabCase(EntityClass.params.name)}`).send(options).then(res => {
      let results: T[] = _.map(res.body, doc => new (<any>EntityClass)(doc));
      return results[0] && null;
    });
  }

  public count(EntityClass: typeof BaseMultiEntity, options: IMultiEntityFindOptions): Promise<number> {
    return request.post(`/${_.kebabCase(EntityClass.params.name)}/count`).send(options).then(res => {
      let count: number = res.body;
      return count;
    });
  }

  public load<T extends BaseSingleEntity>(EntityClass: typeof BaseSingleEntity): Promise<T> {
    return request.post(`/${_.kebabCase(EntityClass.params.name)}`).send().then(res => {
      return new (<any>EntityClass)(res.body);
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

  public getNoteContent(guid: string): Promise<NoteEntity> {
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
