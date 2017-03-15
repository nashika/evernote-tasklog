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

  async find<T extends BaseMultiEntity>(EntityClass: typeof BaseMultiEntity, options: IMultiEntityFindOptions = {}): Promise<T[]> {
    let res = await request.post(`/${_.kebabCase(EntityClass.params.name)}`).send(options);
    return _.map(res.body, doc => new (<any>EntityClass)(doc));
  }

  async findOne<T extends BaseMultiEntity>(EntityClass: typeof BaseMultiEntity, options: IMultiEntityFindOptions = {}): Promise<T> {
    options.limit = 1;
    let res = await request.post(`/${_.kebabCase(EntityClass.params.name)}`).send(options);
    let results: T[] = _.map(res.body, doc => new (<any>EntityClass)(doc));
    return results[0] || null;
  }

  async count(EntityClass: typeof BaseMultiEntity, options: IMultiEntityFindOptions): Promise<number> {
    let res = await request.post(`/${_.kebabCase(EntityClass.params.name)}/count`).send(options);
    return res.body;
  }

  async load<T extends BaseSingleEntity>(EntityClass: typeof BaseSingleEntity): Promise<T> {
    let res = await request.post(`/${_.kebabCase(EntityClass.params.name)}`).send();
    return new (<any>EntityClass)(res.body);
  }

  async save<T extends BaseEntity>(EntityClass: typeof BaseEntity, entity: T): Promise<void> {
    await request.post(`/${_.kebabCase(EntityClass.params.name)}/save`).send(entity);
  }

  async sync(): Promise<void> {
    await request.post(`/sync`);
  }

  async getUpdateCount(): Promise<number> {
    return await request.post(`/sync/update-count`).then(res => _.toInteger(res.body));
  }

  async getNoteContent(guid: string): Promise<NoteEntity> {
    let res = await request.post(`/note/get-content`).send({guid: guid});
    return res.body ? new NoteEntity(res.body) : null;
  }

  async reParseNote(): Promise<void> {
    await request.post(`/note/re-parse`);
  }

  async loadAuth(): Promise<GlobalUserEntity> {
    let res = await request.post(`/global-user/load`);
    return res.body ? new GlobalUserEntity(res.body) : null;
  }

  async changeAuth(globalUser: GlobalUserEntity): Promise<void> {
    await request.post("/global-user/change").send(globalUser);
  }

  async tokenAuth(sandbox: boolean, token: string): Promise<GlobalUserEntity> {
    if (!token) return Promise.reject<GlobalUserEntity>("No Token");
    let res = await request.post(`/global-user/auth`).send({sandbox: sandbox, token: token});
    return new GlobalUserEntity(res.body);
  }

  async logoutAuth(): Promise<void> {
    await request.post(`/global-user/logout`);
  }

}
