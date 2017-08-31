import {injectable} from "inversify";

import {TableService} from "./table.service";
import {BaseServerService} from "./base-server.service";
import {SocketIoServerService} from "./socket-io-server-service";

@injectable()
export class ConstraintServerService extends BaseServerService {

  constructor(protected tableService: TableService,
              protected socketIoServerService: SocketIoServerService) {
    super();
  }

  async checkAll(): Promise<void> {

  }

}
