import {Request, Response, Router} from "express";

import {BaseMultiEntity, IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";
import {BaseMultiTable} from "../table/base-multi-table";
import {BaseEntityRoute} from "./base-entity-route";

export abstract class BaseMultiRoute<T1 extends BaseMultiEntity, T2 extends BaseMultiTable<T1, IMultiEntityFindOptions>> extends BaseEntityRoute<T1, T2> {

  static EntityClass: typeof BaseMultiEntity;

  getRouter(): Router {
    let _router = Router();
    _router.post("/", (req: Request, res: Response) => this.index(req, res));
    _router.post("/count", (req: Request, res: Response) => this.count(req, res));
    return _router;
  }

  index(req: Request, res: Response) {
    this.getTable(req).find(req.body).then((entities: T1[]) => {
      res.json(entities);
    }).catch(err => this.responseErrorJson(res, err));
  }

  count(req: Request, res: Response) {
    this.getTable(req).count(req.body).then(count => {
      res.json(count);
    }).catch(err => this.responseErrorJson(res, err));
  }

}
