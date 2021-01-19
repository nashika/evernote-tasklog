import _ from "lodash";
import SocketIO from "socket.io";

import { BaseRoute } from "~/src/server/route/base.route";
import { container } from "~/src/common/inversify.config";
import { TableService } from "~/src/server/service/table.service";
import { SessionService } from "~/src/server/service/session.service";
import {
  TEntityClass,
  FindManyEntityOptions,
  BaseEntity,
} from "~/src/common/entity/base.entity";
import { SYMBOL_TABLES, SYMBOL_TYPES } from "~/src/common/symbols";
import { BaseTable } from "~/src/server/table/base.table";

export abstract class BaseEntityRoute<
  TEntity extends BaseEntity,
  TTable extends BaseTable<TEntity>
> extends BaseRoute {
  EntityClass: TEntityClass<TEntity>;

  protected constructor(
    protected tableService: TableService,
    protected sessionService: SessionService
  ) {
    super();
    const name = _.lowerFirst(_.replace(this.Class.name, /Route$/, ""));
    this.EntityClass = container.getNamed(
      SYMBOL_TYPES.Entity,
      _.get(SYMBOL_TABLES, name)
    );
  }

  get Class(): typeof BaseEntityRoute {
    return <typeof BaseEntityRoute>this.constructor;
  }

  get table(): TTable {
    return this.tableService.getTable<TEntity, TTable>(this.EntityClass);
  }

  get basePath(): string {
    return this.EntityClass.params.name;
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
    options: FindManyEntityOptions<TEntity>
  ): Promise<TEntity[]> {
    const entities = await this.table.findAll(options);
    return entities;
  }

  protected async onCount(
    _socket: SocketIO.Socket,
    options: FindManyEntityOptions<TEntity>
  ): Promise<number> {
    const count = await this.table.count(options);
    return count;
  }

  protected async onSave(
    _socket: SocketIO.Socket,
    data: Object
  ): Promise<boolean> {
    const entity: TEntity = new this.EntityClass(data);
    await this.table.save(entity);
    return true;
  }

  protected async onRemove(
    _socket: SocketIO.Socket,
    id: number | string
  ): Promise<boolean> {
    if (!id) throw new Error("削除対象のIDが指定されていません");
    await this.table.delete(<any>{
      [this.EntityClass.params.primaryKey]: id,
    });
    return true;
  }
}
