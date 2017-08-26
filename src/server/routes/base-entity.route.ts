import _ = require("lodash");

import {BaseRoute} from "./base.route";
import {BaseEntity, IFindEntityOptions, ICountEntityOptions} from "../../common/entity/base.entity";
import {container} from "../inversify.config";
import {SessionService} from "../service/session.service";
import {TableService} from "../service/table.service";
import {BaseTable} from "../table/base.table";

export abstract class BaseEntityRoute<T1 extends BaseEntity, T2 extends BaseTable<T1>> extends BaseRoute {

  EntityClass: typeof BaseEntity;

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super();
    let name = _.lowerFirst(_.replace(this.Class.name, /Route$/, ""));
    this.EntityClass = <any>container.getNamed(BaseEntity, name);
  }

  get Class(): typeof BaseEntityRoute {
    return <typeof BaseEntityRoute>this.constructor;
  }

  getBasePath(): string {
    return this.EntityClass.params.name;
  }

  getTable(): T2 {
    return <T2>this.tableService.getTable(this.EntityClass);
  }

  async connect(socket: SocketIO.Socket): Promise<void> {
    this.on(socket, "find", this.onFind);
    this.on(socket, "count", this.onCount);
    this.on(socket, "save", this.onSave);
    this.on(socket, "remove", this.onRemove);
  }

  protected async onFind(_socket: SocketIO.Socket, options: IFindEntityOptions<T1>): Promise<T1[]> {
    let entities = await this.getTable().findAll(options);
    return entities;
  }

  protected async onCount(_socket: SocketIO.Socket, options: ICountEntityOptions): Promise<number> {
    let count = await this.getTable().count(options);
    return count;
  }

  protected async onSave(_socket: SocketIO.Socket, data: Object): Promise<boolean> {
    let entity: T1 = new (<any>this.EntityClass)(data);
    await this.getTable().save(entity);
    return true;
  }

  protected async onRemove(_socket: SocketIO.Socket, id: number | string): Promise<boolean> {
    if (!id) throw Error();
    await this.getTable().remove({where: {[this.EntityClass.params.primaryKey]: id}});
    return true;
  }

}
