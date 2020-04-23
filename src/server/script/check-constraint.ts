import "reflect-metadata";

import container from "~/src/server/inversify.config";
import TableService from "~/src/server/service/table.service";
import ConstraintService from "~/src/server/service/constraint.service";

const tableService = container.get<TableService>(TableService);
const constraintService = container.get<ConstraintService>(ConstraintService);

(async () => {
  await tableService.initialize();
  console.log("Check constraint started.");
  await constraintService.checkAll();
  console.log("Check constraint finished.");
})();
