import Component from "vue-class-component";
import _ = require("lodash");

import {BaseComponent} from "./base-component";
import {clientServiceRegistry} from "../service/client-service-registry";
import {AppComponent} from "./app-component";
import {AuthEntity} from "../../common/entity/auth-entity";

let template = require("./auth-component.jade");

@Component({
  template: template,
  components: {},
})
export class AuthComponent extends BaseComponent {

  $parent: AppComponent;

  message: string;
  isDeveloper: boolean;
  sandbox: AuthEntity;
  production: AuthEntity;

  data(): any {
    return _.assign(super.data(), {
      message: null,
      isDeveloper: false,
      sandbox: null,
      production: null,
    });
  }

  ready() {
    super.ready();
    this.load();
  }

  load() {
    clientServiceRegistry.request.loadAuth().then(auth => {
      if (auth) {
        this.$parent.mode = "menu";
      } else {
        this.initialize();
      }
    });
  }

  initialize() {
    return Promise.resolve().then(() => {
      return clientServiceRegistry.request.tokenAuth(false).then(auth => this.production = auth);
    }).then(() => {
      return clientServiceRegistry.request.tokenAuth(true).then(auth => this.sandbox = auth);
    }).then(() => null);
  }

  login(sandbox: boolean, useToken: boolean) {
    clientServiceRegistry.request.loginAuth(sandbox, useToken).then(() => {
      this.load();
    }).catch(err => {
      alert(`Login failed. err="${err}"`);
    });
  }

  setToken(sandbox: boolean) {
    var token = prompt(`Input developer token (${sandbox ? "sandbox" : "production"})`);
    if (!token) return;
    return clientServiceRegistry.request.tokenAuth(sandbox, token).then(auth => {
      if (sandbox)
        this.sandbox = auth;
      else
        this.production = auth;
      if (!auth) alert('Token is invalid.');
    }).catch(err => {
      alert(`Set token failed. err="${err}"`);
    });
  }

}
