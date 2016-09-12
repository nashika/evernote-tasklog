import express = require("express");
import {Request, Response, Router} from "express";

import {SettingEntity} from "../../common/entity/setting-entity";
import {SettingTable} from "../table/setting-table";
import {BaseMultiRoute} from "./base-multi-route";

export class SettingRoute extends BaseMultiRoute<SettingEntity, SettingTable> {

  static EntityClass = SettingEntity;

  getRouter(): Router {
    let _router = super.getRouter();
    _router.post("/save", this.onSave);
    return _router;
  }

  onSave = (req: Request, res: Response) => {
    let setting = new SettingEntity(req.body);
    if (!req.body.key) return this.responseErrorJson(res, "No key.");
    this.getTable(req).save(setting).then(() => {
      res.json(true);
    }).catch(err => this.responseErrorJson(res, err));
  };

}
