import Component from "vue-class-component";

import BaseComponent from "./base.component";
import {container} from "../inversify.config";
import {DatastoreService} from "../service/datastore.service";
import {router} from "../app";
import {SocketIoClientService} from "../service/socket-io-client-service";
let Push = require("push.js");

@Component({
  watch: {
    "socketIoClientService.lastUpdateCount": "checkUpdateCount",
  },
})
export default class AppComponent extends BaseComponent {

  datastoreService: DatastoreService = container.get(DatastoreService);
  socketIoClientService: SocketIoClientService = container.get(SocketIoClientService);

  lastUpdateCount: number = 0;
  isReady: boolean = false;

  async mounted(): Promise<void> {
    await super.mounted();
    this.isReady = true;
  }

  async checkUpdateCount(): Promise<void> {
    if (this.lastUpdateCount < this.socketIoClientService.lastUpdateCount) {
      this.lastUpdateCount = this.socketIoClientService.lastUpdateCount;
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
