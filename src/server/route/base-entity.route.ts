import _ from "lodash";
import SocketIO from "socket.io";

import BaseRoute from "~/src/server/route/base.route";
import container from "~/src/server/inversify.config";
import TableSService from "~/src/server/s-service/table-s.service";
import SessionSService from "~/src/server/s-service/session.s-service";
import BaseEntity, {
  IFindManyEntityOptions,
} from "~/src/common/entity/base.entity";
import { SYMBOL_TABLES, SYMBOL_TYPES } from "~/src/common/symbols";
import BaseTable from "~/src/server/table/base.table";

export default abstract class BaseEntityRoute<
  T extends BaseEntity
> extends BaseRoute {
  EntityClass: typeof BaseEntity;

  protected constructor(
    protected tableService: TableSService,
    protected sessionService: SessionSService
  ) {
    super();
    const name = _.lowerFirst(_.replace(this.Class.name, /Route$/, ""));
    this.EntityClass = container.getNamed<typeof BaseEntity>(
      SYMBOL_TYPES.Entity,
      _.get(SYMBOL_TABLES, name)
    );
  }

  get Class(): typeof BaseEntityRoute {
    return <typeof BaseEntityRoute>this.constructor;
  }

  getBasePath(): string {
    return this.EntityClass.params.name;
  }

  getTable(): BaseTable<T> {
    return this.tableService.getTable<T, BaseTable<T>>(this.EntityClass);
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
    options: IFindManyEntityOptions<T>
  ): Promise<T[]> {
    const entities = await this.getTable().findAll(options);
    return entities;
  }

  protected async onCount(
    _socket: SocketIO.Socket,
    options: IFindManyEntityOptions<T>
  ): Promise<number> {
    const count = await this.getTable().count(options);
    return count;
  }

  protected async onSave(
    _socket: SocketIO.Socket,
    data: Object
  ): Promise<boolean> {
    const entity: T = new (<any>this.EntityClass)(data);
    await this.getTable().save(<any>entity);
    return true;
  }

  protected async onRemove(
    _socket: SocketIO.Socket,
    id: number | string
  ): Promise<boolean> {
    if (!id) throw new Error("削除対象のIDが指定されていません");
    await this.getTable().delete(<any>{
      [this.EntityClass.params.primaryKey]: id,
    });
    return true;
  }
}
