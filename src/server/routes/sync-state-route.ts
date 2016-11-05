import {injectable} from "inversify";

import {BaseSingleRoute} from "./base-single-route";
import {TableService} from "../service/table-service";
import {SessionService} from "../service/session-service";
import {SyncStateEntity} from "../../common/entity/sync-state-entity";
import {SyncStateTable} from "../table/sync-state-table";

@injectable()
export class SyncStateRoute extends BaseSingleRoute<SyncStateEntity, SyncStateTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }
}
