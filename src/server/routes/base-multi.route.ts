import {Request, Response, Router} from "express";

import {BaseMultiEntity, IMultiEntityFindOptions} from "../../common/entity/base-multi.entity";
import {BaseMultiTable} from "../table/base-multi.table";
import {BaseTableRoute} from "./base-table.route";

export abstract class BaseMultiRoute<T1 extends BaseMultiEntity, T2 extends BaseMultiTable<T1, IMultiEntityFindOptions>> extends BaseTableRoute<T2> {

  getRouter(): Router {
    let _router = Router();
    _router.post("/", (req, res) => this.wrap(req, res, this.index));
    _router.post("/count", (req, res) => this.wrap(req, res, this.count));
    _router.post("/save", (req, res) => this.wrap(req, res, this.save));
    return _router;
  }

  async index(req: Request, _res: Response): Promise<T1[]> {
    let options: IMultiEntityFindOptions = req.body;
    let entities = await this.getTable(req).find(options);
    return entities;
  }

  async count(req: Request, _res: Response): Promise<number> {
    let options: IMultiEntityFindOptions = req.body;
    let count = await this.getTable(req).count(options);
    return count;
  }

  async save(req: Request, _res: Response): Promise<boolean> {
    let entity: T1 = new (<any>this.EntityClass)(req.body);
    await this.getTable(req).save(entity);
    return true;
  }

}
