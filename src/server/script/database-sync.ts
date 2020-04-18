import "reflect-metadata";

import container from "~/src/server/inversify.config";
import TableSService from "~/src/server/s-service/table.s-service";

const tableSService = container.get<TableSService>(TableSService);

(async () => {
  await tableSService.initialize(false);
  console.log("Synchronize database started.");
  await tableSService.sync();
  console.log("Synchronize database finished.");
})();
