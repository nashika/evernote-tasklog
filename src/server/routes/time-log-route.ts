import express = require("express");

import {TimeLogEntity} from "../../common/entity/time-log-entity";
import {TimeLogTable} from "../table/time-log-table";
import {BaseMultiRoute} from "./base-multi-route";

export class TimeLogRoute extends BaseMultiRoute<TimeLogEntity, TimeLogTable> {

  static EntityClass = TimeLogEntity;

}
