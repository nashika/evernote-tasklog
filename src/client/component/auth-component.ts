import Component from "vue-class-component";
import _ = require("lodash");

import {BaseComponent} from "./base-component";
import {serviceRegistry} from "../service/service-registry";
import {AuthService} from "../service/auth-service";
import {AppComponent} from "./app-component";

let template = require("./auth-component.jade");

@Component({
  template: template,
  components: {},
})
export class AuthComponent extends BaseComponent {

  $parent: AppComponent;

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

  ready() {
    super.ready();
    serviceRegistry.auth.check().then(result => {
      if (result) {
        this.$parent.mode = "menu";
      } else {
        return serviceRegistry.auth.initialize();
      }
    });
  }

  login(sandbox: boolean, useToken: boolean) {
    serviceRegistry.auth.login(sandbox, useToken).then(() => {
      this.$parent.mode = "menu";
    }).catch(err => {
      alert(`Login failed. err="${err}"`);
    });
  }

  setToken(sandbox: boolean) {
    var token = prompt(`Input developer token (${sandbox ? "sandbox" : "production"})`);
    if (!token) return;
    serviceRegistry.auth.setToken(sandbox, token).catch(err => {
      alert(`Set token failed. err="${err}"`);
    });
  }

}
