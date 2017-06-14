import {Container} from "inversify";

import {DatastoreService} from "./service/datastore.service";
import {ProgressService} from "./service/progress.service";
import {RequestService} from "./service/request.service";
import {SocketIoClientService} from "./service/socket-io-client-service";

export var container = new Container();

container.bind<DatastoreService>(DatastoreService).toSelf().inSingletonScope();
container.bind<ProgressService>(ProgressService).toSelf().inSingletonScope();
container.bind<RequestService>(RequestService).toSelf().inSingletonScope();
container.bind<SocketIoClientService>(SocketIoClientService).toSelf().inSingletonScope();
