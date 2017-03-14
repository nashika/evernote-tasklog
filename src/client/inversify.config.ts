import {Container, interfaces} from "inversify";

import {DatastoreService} from "./service/datastore.service";
import {ProgressService} from "./service/progress.service";
import {RequestService} from "./service/request.service";
import {AppComponent} from "./component/app.component";

export var container = new Container();

container.bind<interfaces.Newable<AppComponent>>("Newable<AppComponent>").toConstructor<AppComponent>(AppComponent);

container.bind<DatastoreService>(DatastoreService).toSelf().inSingletonScope();
container.bind<ProgressService>(ProgressService).toSelf().inSingletonScope();
container.bind<RequestService>(RequestService).toSelf().inSingletonScope();
