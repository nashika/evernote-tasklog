require('source-map-support').install();

import "reflect-metadata";
import {container} from "../inversify.config";
import {TableService} from "../service/table.service";

let tableService = container.get<TableService>(TableService);

tableService.initialize();
console.log("Synchronize database started.");
tableService.sync();
console.log("Synchronize database finished.");
