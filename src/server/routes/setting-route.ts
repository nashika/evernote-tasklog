import express = require("express");

import {SettingEntity} from "../../common/entity/setting-entity";
import {SettingTable} from "../table/setting-table";
import {BaseMultiRoute} from "./base-multi-route";

export class SettingRoute extends BaseMultiRoute<SettingEntity, SettingTable> {

  static EntityClass = SettingEntity;

}
