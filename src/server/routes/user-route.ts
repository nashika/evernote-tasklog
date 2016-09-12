import express = require("express");

import {UserEntity} from "../../common/entity/user-entity";
import {UserTable} from "../table/user-table";
import {BaseSingleRoute} from "./base-single-route";

export class UserRoute extends BaseSingleRoute<UserEntity, UserTable> {

  static EntityClass = UserEntity;

}
