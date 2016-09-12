import {Request, Response, Router} from "express";

import {BaseSingleEntity} from "../../common/entity/base-single-entity";
import {BaseSingleTable} from "../table/base-single-table";
import {BaseEntityRoute} from "./base-entity-route";

export abstract class BaseSingleRoute<T1 extends BaseSingleEntity, T2 extends BaseSingleTable<T1>> extends BaseEntityRoute<T1, T2> {

  static EntityClass: typeof BaseSingleEntity;

  getRouter(): Router {
    let _router = Router();
    _router.post("/", (req: Request, res: Response) => this.index(req, res));
    return _router;
  }

  index(req: Request, res: Response) {
    this.getTable(req).findOne().then(entity => {
      res.json(entity);
    }).catch(err => this.responseErrorJson(res, err));
  }

}
