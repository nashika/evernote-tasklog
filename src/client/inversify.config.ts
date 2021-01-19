import { container } from "~/src/common/inversify.config";

import { NoteLogsService } from "~/src/client/service/note-logs.service";
import { PushService } from "~/src/client/service/push.service";
import { RequestService } from "~/src/client/service/request.service";
import { SocketIoClientService } from "~/src/client/service/socket-io-client.service";
import { SYMBOL_TYPES } from "~/src/common/symbols";
import { ILogger } from "~/src/common/logger";
import { clientLogger } from "~/src/client/logger";

// Logger系
container.bind<ILogger>(SYMBOL_TYPES.Logger).toConstantValue(clientLogger);

// Service系
container.bind<NoteLogsService>(NoteLogsService).toSelf().inSingletonScope();
container.bind<PushService>(PushService).toSelf().inSingletonScope();
container.bind<RequestService>(RequestService).toSelf().inSingletonScope();
container
  .bind<SocketIoClientService>(SocketIoClientService)
  .toSelf()
  .inSingletonScope();
