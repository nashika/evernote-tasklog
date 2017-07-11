import Component from "vue-class-component";

import BaseComponent from "./base.component";
import {container} from "../inversify.config";
import {DatastoreService} from "../service/datastore.service";
import {router} from "../app";
import {SocketIoClientService} from "../service/socket-io-client-service";
import {logger} from "../logger";

let Push = require("push.js");

@Component({})
export default class AppComponent extends BaseComponent {

  datastoreService: DatastoreService = container.get(DatastoreService);
  socketIoClientService: SocketIoClientService = container.get(SocketIoClientService);

  lastUpdateCount: number = 0;
  isReady: boolean = false;
  showMenu: boolean = false;

  async mounted(): Promise<void> {
    await super.mounted();
    await this.datastoreService.initialize();
    this.socketIoClientService.on(this, "sync::updateCount", this.checkUpdateCount);
    this.$on("reload", () => this.reload());
    this.isReady = true;
  }

  async checkUpdateCount(updateCount: number): Promise<void> {
    logger.debug(`Update count from server, updateCount=${updateCount}`);
    if (this.lastUpdateCount < updateCount) {
      this.lastUpdateCount = updateCount;
      this.reload();
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

  reload() {
    (<any>this.$refs.main).reload();
  }

}
