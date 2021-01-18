import _ from "lodash";

import { injectable } from "inversify";
import SocketIoClientService from "./socket-io-client.service";
import BaseClientService from "./base-client.service";
import NoteEntity from "~/src/common/entity/note.entity";
import OptionEntity from "~/src/common/entity/option.entity";
import BaseEntity, {
  TEntityClass,
  FindManyEntityOptions,
  FindOneEntityOptions,
} from "~/src/common/entity/base.entity";

@injectable()
export default class RequestService extends BaseClientService {
  constructor(protected socketIoClientService: SocketIoClientService) {
    super();
  }

  async find<T extends BaseEntity>(
    EntityClass: TEntityClass<T>,
    options: FindManyEntityOptions<T> = {}
  ): Promise<T[]> {
    const datas = await this.socketIoClientService.request<Partial<T>[]>(
      `${EntityClass.params.name}::find`,
      options
    );
    return _.map(datas, (data) => new EntityClass(data));
  }

  async findOne<T extends BaseEntity>(
    EntityClass: TEntityClass<T>,
    options: FindOneEntityOptions<T> = {}
  ): Promise<T> {
    const findOneOptions: FindManyEntityOptions<T> = _.clone(options);
    findOneOptions.take = 1;
    const datas = await this.socketIoClientService.request<Partial<T>>(
      `${EntityClass.params.name}::find`,
      findOneOptions
    );
    const results: T[] = _.map(datas, (data) => new EntityClass(data));
    return results[0] || null;
  }

  async count<T extends BaseEntity>(
    EntityClass: TEntityClass<T>,
    options: FindManyEntityOptions<T>
  ): Promise<number> {
    return this.socketIoClientService.request<number>(
      `${EntityClass.params.name}::count`,
      options
    );
  }

  async save<T extends BaseEntity>(
    EntityClass: TEntityClass<T>,
    entity: T
  ): Promise<void> {
    await this.socketIoClientService.request(
      `${EntityClass.params.name}::save`,
      entity
    );
  }

  async remove<T extends BaseEntity>(
    EntityClass: TEntityClass<T>,
    id: number | string
  ): Promise<void> {
    await this.socketIoClientService.request(
      `${EntityClass.params.name}::remove`,
      id
    );
  }

  async loadOption(key: string): Promise<any> {
    const options: FindOneEntityOptions<any> = { where: { key } };
    const optionEntity = await this.findOne<OptionEntity>(
      OptionEntity,
      options
    );
    return optionEntity ? optionEntity.value : null;
  }

  async saveOption(key: string, value: any): Promise<void> {
    const optionEntity = new OptionEntity({ key, value });
    await this.save<OptionEntity>(OptionEntity, optionEntity);
  }

  async loadSession(key: string): Promise<any> {
    return this.socketIoClientService.request("session::load", key);
  }

  async saveSession(key: string, value: any): Promise<void> {
    return this.socketIoClientService.request("session::save", key, value);
  }

  async sync(): Promise<void> {
    await this.socketIoClientService.request(`sync::run`);
  }

  async getNoteContent(guid: string): Promise<NoteEntity | null> {
    const data = await this.socketIoClientService.request(
      `note::getContent`,
      guid
    );
    return data ? new NoteEntity(data) : null;
  }

  async reParseNote(): Promise<void> {
    await this.socketIoClientService.request(`note::reParse`, {});
  }
}
