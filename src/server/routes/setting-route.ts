import express = require("express");
import {injectable} from "inversify";

import {SettingEntity} from "../../common/entity/setting-entity";
import {SettingTable} from "../table/setting-table";
import {BaseMultiRoute} from "./base-multi-route";
import {TableService} from "../service/table-service";
import {SessionService} from "../service/session-service";

@injectable()
export class SettingRoute extends BaseMultiRoute<SettingEntity, SettingTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }

}
