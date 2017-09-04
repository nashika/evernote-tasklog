import {injectable} from "inversify";

import {BaseEntityRoute} from "./base-entity.route";
import {TableService} from "../service/table.service";
import {SessionService} from "../service/session.service";
import {ConstraintResultTable} from "../table/constraint-result.table";
import {ConstraintResultEntity} from "../../common/entity/constraint-result.entity";

@injectable()
export class ConstraintResultRoute extends BaseEntityRoute<ConstraintResultEntity, ConstraintResultTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }

}
