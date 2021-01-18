import NoteLogsService from "~/src/client/service/note-logs.service";
import PushService from "~/src/client/service/push.service";
import RequestService from "~/src/client/service/request.service";
import SocketIoClientService from "~/src/client/service/socket-io-client.service";

import "~/src/client/inversify.config";
import container from "~/src/common/inversify.config";

interface IMyService {
  noteLogs: NoteLogsService;
  push: PushService;
  request: RequestService;
  socketIoClient: SocketIoClientService;
}

export const myService: IMyService = <any>{};
myService.noteLogs = container.get(NoteLogsService);
myService.push = container.get(PushService);
myService.request = container.get(RequestService);
myService.socketIoClient = container.get(SocketIoClientService);
