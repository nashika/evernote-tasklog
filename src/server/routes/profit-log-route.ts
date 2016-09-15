import express = require("express");
import {injectable} from "inversify";

import {ProfitLogEntity} from "../../common/entity/profit-log-entity";
import {ProfitLogTable} from "../table/profit-log-table";
import {BaseMultiRoute} from "./base-multi-route";
import {SessionService} from "../service/session-service";

@injectable()
export class ProfitLogRoute extends BaseMultiRoute<ProfitLogEntity, ProfitLogTable> {

  constructor(protected sessionService: SessionService) {
    super(sessionService);
  }

}
