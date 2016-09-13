import {Kernel} from "inversify";

import {SessionService} from "./service/session-service";
import {AuthRoute} from "./routes/auth-route";

export var kernel = new Kernel();
kernel.bind<SessionService>(SessionService).to(SessionService);
kernel.bind<AuthRoute>(AuthRoute).to(AuthRoute);
