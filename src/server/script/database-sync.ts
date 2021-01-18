import "reflect-metadata";

import container from "~/src/common/inversify.config";
import TableService from "~/src/server/service/table.service";

const tableService = container.get<TableService>(TableService);

(async () => {
  await tableService.initialize(false);
  console.log("Synchronize database started.");
  await tableService.sync();
  console.log("Synchronize database finished.");
})();
