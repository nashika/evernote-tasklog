import { injectable } from "inversify";

import ConstraintResultEntity from "~/src/common/entity/constraint-result.entity";
import BaseTable from "~/src/server/table/base.table";

@injectable()
export default class ConstraintResultTable extends BaseTable<
  ConstraintResultEntity
> {}
