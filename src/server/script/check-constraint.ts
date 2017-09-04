
require('source-map-support').install();

import "reflect-metadata";
import {container} from "../inversify.config";
import {TableService} from "../service/table.service";
import {ConstraintServerService} from "../service/constraint-server-service";

let tableService = container.get<TableService>(TableService);
let constraintServerService = container.get<ConstraintServerService>(ConstraintServerService);

(async () => {
  await tableService.initialize();
  console.log("Check constraint started.");
  await constraintServerService.checkAll();
  console.log("Check constraint finished.");
})();
