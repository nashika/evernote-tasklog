import "reflect-metadata";

import container from "~/src/server/inversify.config";
import TableSService from "~/src/server/s-service/table.s-service";
import ConstraintSService from "~/src/server/s-service/constraint.s-service";

const tableSService = container.get<TableSService>(TableSService);
const constraintSService = container.get<ConstraintSService>(
  ConstraintSService
);

(async () => {
  await tableSService.initialize();
  console.log("Check constraint started.");
  await constraintSService.checkAll();
  console.log("Check constraint finished.");
})();
