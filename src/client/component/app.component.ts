import Component from "vue-class-component";

import BaseComponent from "./base.component";
import {container} from "../inversify.config";
import {DatastoreService} from "../service/datastore.service";
import {router} from "../app";
let Push = require("push.js");

@Component({})
export default class AppComponent extends BaseComponent {

  datastoreService: DatastoreService = container.get(DatastoreService);

  isReady = false;
  lastUpdateCount: number = 0;

  async created(): Promise<void> {
  }

  async mounted(): Promise<void> {
    await super.mounted();
    await this.datastoreService.initialize();
    this.isReady = true;
    setInterval(() => this.interval(), 5000);
  }

  async interval(): Promise<void> {
    let isUpdated = await this.datastoreService.checkUpdateCount();
    if (isUpdated) {
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
