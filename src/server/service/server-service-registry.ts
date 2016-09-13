import {SingletonRegistry} from "../../common/util/singleton-registry";
import {BaseServerService} from "./base-server-service";
import {SessionService} from "./session-service";

export class ServerServiceRegistry extends SingletonRegistry<BaseServerService> {

  Classes: {[key: string]: typeof BaseServerService} = {
    session: SessionService,
  };

  get session(): SessionService {
    return <SessionService>this.getInstance("session");
  }

}

export var serverServiceRegistry = new ServerServiceRegistry();
