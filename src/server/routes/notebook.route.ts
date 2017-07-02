import {injectable} from "inversify";

import {BaseEntityRoute} from "./base-entity.route";
import {NotebookEntity} from "../../common/entity/notebook.entity";
import {NotebookTable} from "../table/notebook.table";
import {TableService} from "../service/table.service";
import {SessionService} from "../service/session.service";

@injectable()
export class NotebookRoute extends BaseEntityRoute<NotebookEntity, NotebookTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }

}
