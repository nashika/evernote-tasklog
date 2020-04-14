import _ from "lodash";
import SocketIO from "socket.io";

import BaseRoute from "~/src/server/route/base.route";
import BaseRepository from "~/src/server/repository/base.repository";
import container from "~/src/server/inversify.config";
import RepositorySService from "~/src/server/s-service/repository.s-service";
import SessionSService from "~/src/server/s-service/session.s-service";
import BaseCEntity, {
  IFindManyCEntityOptions,
} from "~/src/common/c-entity/base.c-entity";

export default abstract class BaseEntityRoute<
  TCEntity extends BaseCEntity,
  TRepository extends BaseRepository<TCEntity>
> extends BaseRoute {
  CEntityClass: typeof BaseCEntity = BaseCEntity;

  protected constructor(
    protected repositoryService: RepositorySService,
    protected sessionService: SessionSService
  ) {
    super();
    const name = _.lowerFirst(_.replace(this.Class.name, /Route$/, ""));
    this.CEntityClass = <any>container.getNamed(BaseCEntity, name);
  }

  get Class(): typeof BaseEntityRoute {
    return <typeof BaseEntityRoute>this.constructor;
  }

  getBasePath(): string {
    return this.CEntityClass.params.name;
  }

  getRepository(): TRepository {
    return <TRepository>this.repositoryService.getRepository(this.CEntityClass);
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
    options: IFindManyCEntityOptions<TCEntity>
  ): Promise<TCEntity[]> {
    const entities = await this.getRepository().find(options);
    return entities;
  }

  protected async onCount(
    _socket: SocketIO.Socket,
    options: IFindManyCEntityOptions<TCEntity>
  ): Promise<number> {
    const count = await this.getRepository().count(options);
    return count;
  }

  protected async onSave(
    _socket: SocketIO.Socket,
    data: Object
  ): Promise<boolean> {
    const entity: TCEntity = new (<any>this.CEntityClass)(data);
    await this.getRepository().save(<any>entity);
    return true;
  }

  protected async onRemove(
    _socket: SocketIO.Socket,
    id: number | string
  ): Promise<boolean> {
    if (!id) throw new Error("削除対象のIDが指定されていません");
    await this.getRepository().delete(<any>{
      [this.CEntityClass.params.primaryKey]: id,
    });
    return true;
  }
}
