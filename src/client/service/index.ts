import DatastoreService from "~/src/client/service/datastore.service";
import PushService from "~/src/client/service/push.service";
import RequestService from "~/src/client/service/request.service";
import SocketIoClientService from "~/src/client/service/socket-io-client.service";

interface IMyService {
  datastore: DatastoreService;
  push: PushService;
  request: RequestService;
  socketIoClient: SocketIoClientService;
}

export const myService: IMyService = <any>{};
myService.socketIoClient = new SocketIoClientService();
myService.request = new RequestService(myService.socketIoClient);
myService.push = new PushService(myService.socketIoClient);
myService.datastore = new DatastoreService(myService.request);
