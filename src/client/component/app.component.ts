import Component from "vue-class-component";

import BaseComponent from "./base.component";
import {container} from "../inversify.config";
import {DatastoreService} from "../service/datastore.service";
import {SocketIoClientService} from "../service/socket-io-client-service";
import {PushService} from "../service/push.service";

@Component({})
export default class AppComponent extends BaseComponent {

  datastoreService: DatastoreService = container.get(DatastoreService);
  socketIoClientService: SocketIoClientService = container.get(SocketIoClientService);
  pushService: PushService = container.get(PushService);

  isReady: boolean = false;
  showMenu: boolean = false;

  async mounted(): Promise<void> {
    await super.mounted();
    await this.datastoreService.initialize();
    this.$on("reload", () => this.reload());
    this.pushService.initialize(this);
    this.isReady = true;
  }

  reload() {
    (<any>this.$refs.main).reload();
  }

}
