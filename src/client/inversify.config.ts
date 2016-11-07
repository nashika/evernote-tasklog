import {Kernel, interfaces} from "inversify";

import {DatastoreService} from "./service/datastore-service";
import {ProgressService} from "./service/progress-service";
import {RequestService} from "./service/request-service";
import {AppComponent} from "./component/app-component";

export var kernel = new Kernel();

kernel.bind<interfaces.Newable<AppComponent>>("Newable<AppComponent>").toConstructor<AppComponent>(AppComponent);

kernel.bind<DatastoreService>(DatastoreService).toSelf().inSingletonScope();
kernel.bind<ProgressService>(ProgressService).toSelf().inSingletonScope();
kernel.bind<RequestService>(RequestService).toSelf().inSingletonScope();
