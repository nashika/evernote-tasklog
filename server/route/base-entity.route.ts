import _ from "lodash";
import SocketIO from "socket.io";

import BaseRoute from "~/server/route/base.route";
import BaseRepository from "~/server/repository/base.repository";
import RepositoryService from "~/server/service/repository.service";
import container from "~/inversify.config";
import SessionService from "~/server/service/session.service";
import BaseSEntity, {
  IFindManyEntityOptions,
} from "~/server/s-entity/base.s-entity";

export default abstract class BaseEntityRoute<
  T1 extends BaseSEntity,
  T2 extends BaseRepository<T1>
> extends BaseRoute {
  SEntityClass: typeof BaseSEntity = BaseSEntity;

  constructor(
    protected repositoryService: RepositoryService,
    protected sessionService: SessionService
  ) {
    super();
    const name = _.lowerFirst(_.replace(this.Class.name, /Route$/, ""));
    this.SEntityClass = <any>container.getNamed(BaseSEntity, name);
  }

  get Class(): typeof BaseEntityRoute {
    return <typeof BaseEntityRoute>this.constructor;
  }

  getBasePath(): string {
    return this.SEntityClass.params.name;
  }

  getRepository(): T2 {
    return <T2>this.repositoryService.getRepository(this.SEntityClass);
  }

  async connect(socket: SocketIO.Socket): Promise<void> {
    this.on(socket, "find", this.onFind);
    this.on(socket, "count", this.onCount);
    this.on(socket, "save", this.onSave);
    this.on(socket, "remove", this.onRemove);
  }

  protected async onFind(
    _socket: SocketIO.Socket,
    options: IFindManyEntityOptions<T1>
  ): Promise<T1[]> {
    const entities = await this.getRepository().find(options);
    return entities;
  }

  protected async onCount(
    _socket: SocketIO.Socket,
    options: IFindManyEntityOptions<T1>
  ): Promise<number> {
    const count = await this.getRepository().count(options);
    return count;
  }

  protected async onSave(
    _socket: SocketIO.Socket,
    data: Object
  ): Promise<boolean> {
    const entity: T1 = new (<any>this.SEntityClass)(data);
    await this.getRepository().save(<any>entity);
    return true;
  }

  protected async onRemove(
    _socket: SocketIO.Socket,
    id: number | string
  ): Promise<boolean> {
    if (!id) throw new Error("削除対象のIDが指定されていません");
    await this.getRepository().delete(<any>{
      [this.SEntityClass.params.primaryKey]: id,
    });
    return true;
  }
}
