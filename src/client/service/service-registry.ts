import {SingletonRegistry} from "../../common/util/singleton-registry";
import {BaseService} from "./base-service";
import {DataTranscieverService} from "./data-transciever-service";
import {ProgressService} from "./progress-service";
import {DataStoreService} from "./data-store-service";
import {AuthService} from "./auth-service";

export class ServiceRegistry extends SingletonRegistry<BaseService> {

  Classes: {[key: string]: typeof BaseService} = {
    auth: AuthService,
    dataStore: DataStoreService,
    dataTransciever: DataTranscieverService,
    progress: ProgressService,
  };

  get auth(): AuthService {
    return <AuthService>this.getInstance("auth");
  }

  get dataStore(): DataStoreService {
    return <DataStoreService>this.getInstance("dataStore");
  }

  get dataTransciever(): DataTranscieverService {
    return <DataTranscieverService>this.getInstance("dataTransciever");
  }

  get progress(): ProgressService {
    return <ProgressService>this.getInstance("progress");
  }

}

export var serviceRegistry = new ServiceRegistry();
