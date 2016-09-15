import {Kernel, interfaces} from "inversify";

import {DataStoreService} from "./service/data-store-service";
import {DataTranscieverService} from "./service/data-transciever-service";
import {ProgressService} from "./service/progress-service";
import {RequestService} from "./service/request-service";
import {AppComponent} from "./component/app-component";

export var kernel = new Kernel();

kernel.bind<interfaces.Newable<AppComponent>>("Newable<AppComponent>").toConstructor<AppComponent>(AppComponent);

kernel.bind<DataStoreService>(DataStoreService).toSelf().inSingletonScope();
kernel.bind<DataTranscieverService>(DataTranscieverService).toSelf().inSingletonScope();
kernel.bind<ProgressService>(ProgressService).toSelf().inSingletonScope();
kernel.bind<RequestService>(RequestService).toSelf().inSingletonScope();
