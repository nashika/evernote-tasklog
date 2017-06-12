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
    return _.kebabCase(this.EntityClass.params.name);
  }

  getTable(socket: SocketIO.Socket): T2 {
    let session = this.sessionService.get(socket);
    if (this.EntityClass.params.requireUser) {
      return <T2>this.tableService.getUserTable(this.EntityClass, session.globalUser);
    } else {
      return <T2>this.tableService.getGlobalTable(this.EntityClass);
    }
  }

  async connect(socket: SocketIO.Socket): Promise<void> {
    this.on(socket, "list", this.onList);
    this.on(socket, "count", this.onCount);
    this.on(socket, "save", this.onSave);
  }

  protected async onList(socket: SocketIO.Socket, options: IFindEntityOptions): Promise<T1[]> {
    let entities = await this.getTable(socket).findAll(options);
    return entities;
  }

  protected async onCount(socket: SocketIO.Socket, options: ICountEntityOptions): Promise<number> {
    let count = await this.getTable(socket).count(options);
    return count;
  }

  protected async onSave(socket: SocketIO.Socket, data: Object): Promise<boolean> {
    let entity: T1 = new (<any>this.EntityClass)(data);
    await this.getTable(socket).save(entity);
    return true;
  }

}
