import Component from "vue-class-component";
import _ = require("lodash");

import {BaseComponent} from "./base-component";
import {AppComponent} from "./app-component";
import {AuthEntity} from "../../common/entity/auth-entity";
import {RequestService} from "../service/request-service";
import {kernel} from "../inversify.config";

let template = require("./auth-component.jade");

@Component({
  template: template,
  components: {},
})
export class AuthComponent extends BaseComponent {

  $parent: AppComponent;

  requestService: RequestService;
  message: string;
  isDeveloper: boolean;
  sandbox: AuthEntity;
  production: AuthEntity;

  data(): any {
    return _.assign(super.data(), {
      requestService: kernel.get(RequestService),
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
    this.requestService.loadAuth().then(auth => {
      if (auth) {
        this.$parent.mode = "menu";
      } else {
        this.initialize();
      }
    });
  }

  initialize() {
    return Promise.resolve().then(() => {
      return this.requestService.tokenAuth(false).then(auth => this.production = auth);
    }).then(() => {
      return this.requestService.tokenAuth(true).then(auth => this.sandbox = auth);
    }).then(() => null);
  }

  login(sandbox: boolean, useToken: boolean) {
    this.requestService.loginAuth(sandbox, useToken).then(() => {
      this.load();
    }).catch(err => {
      alert(`Login failed. err="${err}"`);
    });
  }

  setToken(sandbox: boolean) {
    var token = prompt(`Input developer token (${sandbox ? "sandbox" : "production"})`);
    if (!token) return;
    return this.requestService.tokenAuth(sandbox, token).then(auth => {
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
