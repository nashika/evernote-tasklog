import {Request, Response, Router} from "express";

import {BaseMultiEntity, IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";
import {BaseMultiTable} from "../table/base-multi-table";
import {BaseEntityRoute} from "./base-entity-route";

export abstract class BaseMultiRoute<T1 extends BaseMultiEntity, T2 extends BaseMultiTable<T1, IMultiEntityFindOptions>> extends BaseEntityRoute<T1, T2> {

  static EntityClass: typeof BaseMultiEntity;

  getRouter(): Router {
    let _router = Router();
    _router.post("/", (req, res) => this.wrap(req, res, this.index));
    _router.post("/count", (req, res) => this.wrap(req, res, this.count));
    _router.post("/save", (req, res) => this.wrap(req, res, this.save));
    return _router;
  }

  index(req: Request, res: Response): Promise<T1[]> {
    return this.getTable(req).find(req.body).then((entities: T1[]) => {
      return entities;
    });
  }

  count(req: Request, res: Response): Promise<number> {
    return this.getTable(req).count(req.body).then(count => {
      return count;
    });
  }

  save(req: Request, res: Response): Promise<boolean> {
    let entity: T1 = new (<any>this.Class.EntityClass)(req.body);
    return this.getTable(req).save(entity).then(() => {
      return true;
    });
  }

}
