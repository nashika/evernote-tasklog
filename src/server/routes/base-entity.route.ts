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
    return "/" + _.kebabCase(this.EntityClass.params.name);
  }

  getTable(req: Request): T2 {
    let session = this.sessionService.get(req);
    if (this.EntityClass.params.requireUser) {
      return <T2>this.tableService.getUserTable(this.EntityClass, session.globalUser);
    } else {
      return <T2>this.tableService.getGlobalTable(this.EntityClass);
    }
  }

  async connect(socket: SocketIO.Socket): Promise<void> {
    this.on(socket, "list", this.list);
    this.on(socket, "count", this.count);
    this.on(socket, "save", this.save);
  }

  protected async list(options: IFindEntityOptions): Promise<T1[]> {
    let entities = await this.getTable(req).findAll(options);
    return entities;
  }

  protected async count(req: Request, _res: Response): Promise<number> {
    let options: ICountEntityOptions = req.body;
    let count = await this.getTable(req).count(options);
    return count;
  }

  protected async save(req: Request, _res: Response): Promise<boolean> {
    let entity: T1 = new (<any>this.EntityClass)(req.body);
    await this.getTable(req).save(entity);
    return true;
  }

}
