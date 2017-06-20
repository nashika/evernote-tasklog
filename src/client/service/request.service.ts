import _ = require("lodash");
import {injectable} from "inversify";

import {BaseClientService} from "./base-client.service";
import {BaseEntity, IFindEntityOptions} from "../../common/entity/base.entity";
import {NoteEntity} from "../../common/entity/note.entity";
import {OptionEntity} from "../../common/entity/option.entity";
import {SocketIoClientService} from "./socket-io-client-service";

@injectable()
export class RequestService extends BaseClientService {

  constructor(protected socketIoClientService: SocketIoClientService) {
    super();
  }

  async find<T extends BaseEntity>(EntityClass: typeof BaseEntity, options: IFindEntityOptions = {}): Promise<T[]> {
    let datas = await this.socketIoClientService.request(`${EntityClass.params.name}::find`, options);
    return _.map(datas, data => new (<any>EntityClass)(data));
  }

  async findOne<T extends BaseEntity>(EntityClass: typeof BaseEntity, options: IFindEntityOptions = {}): Promise<T> {
    options.limit = 1;
    let datas = await this.socketIoClientService.request(`${EntityClass.params.name}::find`, options);
    let results: T[] = _.map(datas, data => new (<any>EntityClass)(data));
    return results[0] || null;
  }

  async count(EntityClass: typeof BaseEntity, options: IFindEntityOptions): Promise<number> {
    let data = await this.socketIoClientService.request(`${EntityClass.params.name}::count`, options);
    return data;
  }

  async loadOption(key: string): Promise<any> {
    let options: IFindEntityOptions = {where: {key: key}};
    let optionEntity = await this.findOne<OptionEntity>(OptionEntity, options);
    return optionEntity ? optionEntity.value : null;
  }

  async saveOption(key: string, value: any): Promise<void> {
    let optionEntity = new OptionEntity({key: key, value: value});
    await this.save<OptionEntity>(OptionEntity, optionEntity);
  }

  async save<T extends BaseEntity>(EntityClass: typeof BaseEntity, entity: T): Promise<void> {
    await this.socketIoClientService.request(`${EntityClass.params.name}::save`, entity);
  }

  async sync(): Promise<void> {
    await this.socketIoClientService.request(`sync::run`);
  }

  async getUpdateCount(): Promise<number> {
    let data = await this.socketIoClientService.request(`sync::updateCount`);
    return data;
  }

  async getNoteContent(guid: string): Promise<NoteEntity> {
    let data = await this.socketIoClientService.request(`note::getContent`, {guid: guid});
    return data ? new NoteEntity(data) : null;
  }

  async reParseNote(): Promise<void> {
    await this.socketIoClientService.request(`note::reParse`);
  }

}
