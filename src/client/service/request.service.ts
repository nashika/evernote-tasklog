import _ = require("lodash");
import {injectable} from "inversify";

import {BaseClientService} from "./base-client.service";
import {BaseEntity, IFindEntityOptions, TEntityClass} from "../../common/entity/base.entity";
import {NoteEntity} from "../../common/entity/note.entity";
import {OptionEntity} from "../../common/entity/option.entity";
import {SocketIoClientService} from "./socket-io-client-service";

@injectable()
export class RequestService extends BaseClientService {

  constructor(protected socketIoClientService: SocketIoClientService) {
    super();
  }

  async find<T extends BaseEntity>(EntityClass: TEntityClass<T>, options: IFindEntityOptions<T> = {}): Promise<T[]> {
    let datas = await this.socketIoClientService.request<Object[]>(`${EntityClass.params.name}::find`, options);
    return _.map(datas, data => new (<any>EntityClass)(data));
  }

  async findOne<T extends BaseEntity>(EntityClass: TEntityClass<T>, options: IFindEntityOptions<T> = {}): Promise<T> {
    options.limit = 1;
    let datas = await this.socketIoClientService.request<Object[]>(`${EntityClass.params.name}::find`, options);
    let results: T[] = _.map(datas, data => new (<any>EntityClass)(data));
    return results[0] || null;
  }

  async count<T extends BaseEntity>(EntityClass: TEntityClass<T>, options: IFindEntityOptions<T>): Promise<number> {
    return await this.socketIoClientService.request<number>(`${EntityClass.params.name}::count`, options);
  }

  async save<T extends BaseEntity>(EntityClass: TEntityClass<T>, entity: T): Promise<T> {
    let data = await this.socketIoClientService.request(`${EntityClass.params.name}::save`, entity);
    return data ? new (<any>EntityClass)(data) : null;
  }

  async remove<T extends BaseEntity>(EntityClass: TEntityClass<T>, id: number | string): Promise<void> {
    await this.socketIoClientService.request(`${EntityClass.params.name}::remove`, id);
  }

  async loadOption(key: string): Promise<any> {
    let options: IFindEntityOptions<any> = {where: {key: key}};
    let optionEntity = await this.findOne(OptionEntity, options);
    return optionEntity ? optionEntity.value : null;
  }

  async saveOption(key: string, value: any): Promise<void> {
    let optionEntity = new OptionEntity({key: key, value: value});
    await this.save(OptionEntity, optionEntity);
  }

  async loadSession(key: string): Promise<any> {
    return await this.socketIoClientService.request("session::load", key);
  }

  async saveSession(key: string, value: any): Promise<void> {
    return await this.socketIoClientService.request("session::save", key, value);
  }

  async sync(): Promise<void> {
    await this.socketIoClientService.request(`sync::run`);
  }

  async getNoteContent(guid: string): Promise<NoteEntity> {
    let data = await this.socketIoClientService.request(`note::getContent`, guid);
    return data ? new NoteEntity(data) : null;
  }

  async saveRemoteNote(note: NoteEntity): Promise<NoteEntity> {
    let data = await this.socketIoClientService.request("note::saveRemote", note);
    return data ? new NoteEntity(data) : null;
  }

  async reParseNote(): Promise<void> {
    await this.socketIoClientService.request(`note::reParse`, {});
  }

}
