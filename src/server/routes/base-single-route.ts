import {Request, Response, Router} from "express";

import {BaseSingleEntity} from "../../common/entity/base-single-entity";
import {BaseSingleTable} from "../table/base-single-table";
import {BaseTableRoute} from "./base-table-route";

export abstract class BaseSingleRoute<T1 extends BaseSingleEntity, T2 extends BaseSingleTable<T1>> extends BaseTableRoute<T2> {

  getRouter(): Router {
    let _router = Router();
    _router.post("/", (req, res) => this.wrap(req, res, this.index));
    return _router;
  }

  index(req: Request, _res: Response): Promise<T1> {
    return this.getTable(req).findOne();
  }

}
