import _ = require("lodash");
import {Request, Response, Router} from "express";

import {BaseRoute} from "./base.route";
import {BaseEntity, IMyFindEntityOptions, IMyCountEntityOptions} from "../../common/entity/base.entity";
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

  getRouter(): Router {
    let _router = Router();
    _router.post("/", (req, res) => this.wrap(req, res, this.index));
    _router.post("/count", (req, res) => this.wrap(req, res, this.count));
    _router.post("/save", (req, res) => this.wrap(req, res, this.save));
    return _router;
  }

  async index(req: Request, _res: Response): Promise<T1[]> {
    let options: IMyFindEntityOptions = req.body;
    let entities = await this.getTable(req).findAll(options);
    return entities;
  }

  async count(req: Request, _res: Response): Promise<number> {
    let options: IMyCountEntityOptions = req.body;
    let count = await this.getTable(req).count(options);
    return count;
  }

  async save(req: Request, _res: Response): Promise<boolean> {
    let entity: T1 = new (<any>this.EntityClass)(req.body);
    await this.getTable(req).save(entity);
    return true;
  }

}
