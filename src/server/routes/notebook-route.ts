import {injectable} from "inversify";

import {BaseMultiRoute} from "./base-multi-route";
import {NotebookEntity} from "../../common/entity/notebook-entity";
import {NotebookTable} from "../table/notebook-table";
import {TableService} from "../service/table-service";
import {SessionService} from "../service/session-service";

@injectable()
export class NotebookRoute extends BaseMultiRoute<NotebookEntity, NotebookTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }

}
