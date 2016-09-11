import Component from "vue-class-component";
import _ = require("lodash");

import {BaseComponent} from "./base-component";
import {serviceRegistry} from "../service/service-registry";
import {AuthService} from "../service/auth-service";

let template = require("./auth-component.jade");

@Component({
  template: template,
  components: {},
  ready: AuthComponent.prototype.onReady,
})
export class AuthComponent extends BaseComponent {

  authService: AuthService;
  message: string;
  isDeveloper: boolean;

  data(): any {
    return _.assign(super.data(), {
      authService: serviceRegistry.auth,
      message: null,
      isDeveloper: false,
    });
  }

  onReady(): void {
    serviceRegistry.auth.initialize();
  };

  setToken(sandbox: boolean): void {
    var token = prompt(`Input developer token (${sandbox ? "sandbox" : "production"})`);
    if (!token) return;
    serviceRegistry.auth.setToken(sandbox, token).catch(err => {
      alert(`Set token failed. err=${err}`);
    });
  };

}
