import {SingletonRegistry} from "../../common/util/singleton-registry";
import {BaseService} from "./base-service";
import {DataTranscieverService} from "./data-transciever-service";
import {ProgressService} from "./progress-service";
import {DataStoreService} from "./data-store-service";
import {RequestService} from "./request-service";

export class ServiceRegistry extends SingletonRegistry<BaseService> {

  Classes: {[key: string]: typeof BaseService} = {
    dataStore: DataStoreService,
    dataTransciever: DataTranscieverService,
    progress: ProgressService,
    request: RequestService,
  };

  get dataStore(): DataStoreService {
    return <DataStoreService>this.getInstance("dataStore");
  }

  get dataTransciever(): DataTranscieverService {
    return <DataTranscieverService>this.getInstance("dataTransciever");
  }

  get progress(): ProgressService {
    return <ProgressService>this.getInstance("progress");
  }

  get request(): RequestService {
    return <RequestService>this.getInstance("request");
  }

}

export var serviceRegistry = new ServiceRegistry();
