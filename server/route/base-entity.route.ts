import _ from "lodash";
import SocketIO from "socket.io";

import BaseRoute from "~/server/route/base.route";
import IBaseSEntity from "~/server/s-entity/base.s-entity";
import BaseRepository from "~/server/repository/base.repository";
import BaseEntity from "~/common/entity/base.entity";
import RepositoryService from "~/server/service/repository.service";
import container from "~/inversify.config";
import SessionService from "~/server/service/session.service";

export default abstract class BaseEntityRoute<
  T1 extends IBaseSEntity,
  T2 extends BaseRepository<T1>
> extends BaseRoute {
  EntityClass: typeof BaseEntity = BaseEntity;

  constructor(
    protected repositoryService: RepositoryService,
    protected sessionService: SessionService
  ) {
    super();
    const name = _.lowerFirst(_.replace(this.Class.name, /Route$/, ""));
    this.EntityClass = <any>container.getNamed(BaseEntity, name);
  }

  get Class(): typeof BaseEntityRoute {
    return <typeof BaseEntityRoute>this.constructor;
  }

  getBasePath(): string {
    return this.EntityClass.params.name;
  }

  getRepository(): T2 {
    return <T2>this.repositoryService.getRepository(this.EntityClass);
  }

  async connect(socket: SocketIO.Socket): Promise<void> {
    this.on(socket, "find", this.onFind);
    this.on(socket, "count", this.onCount);
    this.on(socket, "save", this.onSave);
    this.on(socket, "remove", this.onRemove);
  }

  protected async onFind(
    _socket: SocketIO.Socket,
    options: IFindEntityOptions<T1>
  ): Promise<T1[]> {
    const entities = await this.getRepository().find(options);
    return entities;
  }

  protected async onCount(
    _socket: SocketIO.Socket,
    options: ICountEntityOptions
  ): Promise<number> {
    const count = await this.getRepository().count(options);
    return count;
  }

  protected async onSave(
    _socket: SocketIO.Socket,
    data: Object
  ): Promise<boolean> {
    const entity: T1 = new (<any>this.EntityClass)(data);
    await this.getRepository().save(entity);
    return true;
  }

  protected async onRemove(
    _socket: SocketIO.Socket,
    id: number | string
  ): Promise<boolean> {
    if (!id) throw new Error("削除対象のIDが指定されていません");
    await this.getRepository().delete(<any>{
      [this.EntityClass.params.primaryKey]: id,
    });
    return true;
  }
}
