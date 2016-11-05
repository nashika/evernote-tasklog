import {injectable} from "inversify";

import {UserEntity} from "../../common/entity/user-entity";
import {UserTable} from "../table/user-table";
import {BaseSingleRoute} from "./base-single-route";
import {TableService} from "../service/table-service";
import {SessionService} from "../service/session-service";

@injectable()
export class UserRoute extends BaseSingleRoute<UserEntity, UserTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }
}
