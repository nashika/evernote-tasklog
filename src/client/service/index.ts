import NoteLogsService from "~/src/client/service/note-logs.service";
import PushService from "~/src/client/service/push.service";
import RequestService from "~/src/client/service/request.service";
import SocketIoClientService from "~/src/client/service/socket-io-client.service";

interface IMyService {
  noteLogs: NoteLogsService;
  push: PushService;
  request: RequestService;
  socketIoClient: SocketIoClientService;
}

export const myService: IMyService = <any>{};
myService.socketIoClient = new SocketIoClientService();
myService.request = new RequestService(myService.socketIoClient);
myService.push = new PushService(myService.socketIoClient, myService.request);
myService.noteLogs = new NoteLogsService(myService.request);
