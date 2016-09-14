import express = require("express");
import {injectable} from "inversify";

import {SettingEntity} from "../../common/entity/setting-entity";
import {SettingTable} from "../table/setting-table";
import {BaseMultiRoute} from "./base-multi-route";
import {SessionService} from "../service/session-service";

@injectable()
export class SettingRoute extends BaseMultiRoute<SettingEntity, SettingTable> {

  static EntityClass = SettingEntity;

  constructor(protected sessionService: SessionService) {
    super(sessionService);
  }

}
