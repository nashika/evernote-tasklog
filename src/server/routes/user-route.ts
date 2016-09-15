import express = require("express");
import {injectable} from "inversify";

import {UserEntity} from "../../common/entity/user-entity";
import {UserTable} from "../table/user-table";
import {BaseSingleRoute} from "./base-single-route";
import {SessionService} from "../service/session-service";

@injectable()
export class UserRoute extends BaseSingleRoute<UserEntity, UserTable> {

  constructor(protected sessionService: SessionService) {
    super(sessionService);
  }

}
