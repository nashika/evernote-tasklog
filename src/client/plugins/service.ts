import { Plugin } from "@nuxt/types";

import SocketIoClientService from "~/src/client/service/socket-io-client.service";
import RequestService from "~/src/client/service/request.service";
import ProgressService from "~/src/client/service/progress.service";
import PushService from "~/src/client/service/push.service";
import DatastoreService from "~/src/client/service/datastore.service";

const socketIoClientService: SocketIoClientService = new SocketIoClientService();
const progressService: ProgressService = new ProgressService();
const requestService: RequestService = new RequestService(
  socketIoClientService
);
const pushService: PushService = new PushService(socketIoClientService);
const datastoreService: DatastoreService = new DatastoreService(
  requestService,
  progressService,
  socketIoClientService
);
const servicePlugin: Plugin = (_context, inject) => {
  inject("socketIoClientService", socketIoClientService);
  inject("progressService", progressService);
  inject("requestService", requestService);
  inject("pushService", pushService);
  inject("datastoreService", datastoreService);
};
export default servicePlugin;

declare module "vue/types/vue" {
  interface Vue {
    $socketIoClientService: SocketIoClientService;
    $progressService: ProgressService;
    $requestService: RequestService;
    $pushService: PushService;
    $datastoreService: DatastoreService;
  }
}

declare module "@nuxt/types" {
  interface NuxtAppOptions {
    $socketIoClientService: SocketIoClientService;
    $progressService: ProgressService;
    $requestService: RequestService;
    $pushService: PushService;
    $datastoreService: DatastoreService;
  }
}

declare module "vuex/types/index" {
  interface Store<S> {
    $socketIoClientService: SocketIoClientService;
    $progressService: ProgressService;
    $requestService: RequestService;
    $pushService: PushService;
    $datastoreService: DatastoreService;
  }
}
