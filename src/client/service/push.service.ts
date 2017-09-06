import {injectable} from "inversify";

import {BaseClientService} from "./base-client.service";
import {logger} from "../logger";
import {router} from "../app";
import AppComponent from "../component/app.component";
import {SocketIoClientService} from "./socket-io-client-service";

let Push = require("push.js");

@injectable()
export class PushService extends BaseClientService {

  lastUpdateCount: number = 0;
  appComponent: AppComponent;

  constructor(protected socketIoClientService: SocketIoClientService) {
    super();
  }

  initialize(appComponent: AppComponent): void{
    this.appComponent = appComponent;
    this.socketIoClientService.on(this, "sync::updateCount", this.checkUpdateCount);
  }

  private async checkUpdateCount(updateCount: number): Promise<void> {
    logger.debug(`Update count from server, updateCount=${updateCount}`);
    if (this.lastUpdateCount < updateCount) {
      this.lastUpdateCount = updateCount;
      this.appComponent.reload();
      Push.create("Evernote Tasklog", {
        body: "Note was updated, check activity.",
        link: "#/activity",
        onClick: function (this: any) {
          router.push("activity");
          this.close();
        },
      });
    }
  }

}
