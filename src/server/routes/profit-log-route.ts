import express = require("express");

import {ProfitLogEntity} from "../../common/entity/profit-log-entity";
import {ProfitLogTable} from "../table/profit-log-table";
import {BaseMultiRoute} from "./base-multi-route";

export class ProfitLogRoute extends BaseMultiRoute<ProfitLogEntity, ProfitLogTable> {

  static EntityClass = ProfitLogEntity;

}
