import container from "~/src/common/inversify.config";

import NoteLogsService from "~/src/client/service/note-logs.service";
import PushService from "~/src/client/service/push.service";
import RequestService from "~/src/client/service/request.service";
import SocketIoClientService from "~/src/client/service/socket-io-client.service";

// Service系
container.bind<NoteLogsService>(NoteLogsService).toSelf().inSingletonScope();
container.bind<PushService>(PushService).toSelf().inSingletonScope();
container.bind<RequestService>(RequestService).toSelf().inSingletonScope();
container
  .bind<SocketIoClientService>(SocketIoClientService)
  .toSelf()
  .inSingletonScope();

export default container;
