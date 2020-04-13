import _ from "lodash";
import SocketIO from "socket.io";

import BaseRoute from "~/src/server/route/base.route";
import BaseRepository from "~/src/server/repository/base.repository";
import container from "~/src/server/inversify.config";
import BaseSEntity from "~/src/server/s-entity/base.s-entity";
import RepositorySService from "~/src/server/s-service/repository.s-service";
import SessionSService from "~/src/server/s-service/session.s-service";
import { IFindManyCEntityOptions } from "~/src/common/c-entity/base.c-entity";

export default abstract class BaseEntityRoute<
  TSEntity extends BaseSEntity,
  TRepository extends BaseRepository<TSEntity>
> extends BaseRoute {
  SEntityClass: typeof BaseSEntity = BaseSEntity;

  constructor(
    protected repositoryService: RepositorySService,
    protected sessionService: SessionSService
  ) {
    super();
    const name = _.lowerFirst(_.replace(this.Class.name, /Route$/, ""));
    this.SEntityClass = <any>container.getNamed(BaseSEntity, name);
  }

  get Class(): typeof BaseEntityRoute {
    return <typeof BaseEntityRoute>this.constructor;
  }

  getBasePath(): string {
    return this.SEntityClass.CEntityClass.params.name;
  }

  getRepository(): TRepository {
    return <TRepository>this.repositoryService.getRepository(this.SEntityClass);
  }

  async connect(socket: SocketIO.Socket): Promise<void> {
    this.on(socket, "find", this.onFind);
    this.on(socket, "count", this.onCount);
    this.on(socket, "save", this.onSave);
    this.on(socket, "remove", this.onRemove);
    await Promise.resolve();
  }

  protected async onFind(
    _socket: SocketIO.Socket,
    options: IFindManyCEntityOptions<TSEntity>
  ): Promise<TSEntity[]> {
    const entities = await this.getRepository().find(options);
    return entities;
  }

  protected async onCount(
    _socket: SocketIO.Socket,
    options: IFindManyCEntityOptions<TSEntity>
  ): Promise<number> {
    const count = await this.getRepository().count(options);
    return count;
  }

  protected async onSave(
    _socket: SocketIO.Socket,
    data: Object
  ): Promise<boolean> {
    const entity: TSEntity = new (<any>this.SEntityClass)(data);
    await this.getRepository().save(<any>entity);
    return true;
  }

  protected async onRemove(
    _socket: SocketIO.Socket,
    id: number | string
  ): Promise<boolean> {
    if (!id) throw new Error("削除対象のIDが指定されていません");
    await this.getRepository().delete(<any>{
      [this.SEntityClass.CEntityClass.params.primaryKey]: id,
    });
    return true;
  }
}
