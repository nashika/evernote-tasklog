require('source-map-support').install();

import "reflect-metadata";
import {container} from "../inversify.config";
import {TableService} from "../service/table.service";

let tableService = container.get<TableService>(TableService);

(async () => {
  await tableService.initialize();
  console.log("Synchronize database started.");
  await tableService.sync();
  console.log("Synchronize database finished.");
})();
