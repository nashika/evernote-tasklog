import Component from "vue-class-component";
import _ = require("lodash");

import {MenuModeComponent} from "../menu-mode.component";
import {BaseComponent} from "../../base.component";
import {kernel} from "../../../inversify.config";
import {DatastoreService} from "../../../service/datastore.service";
import {RequestService} from "../../../service/request.service";
import {GlobalUserEntity} from "../../../../common/entity/global-user.entity";
import {AppComponent} from "../../app.component";

let template = require("./user-menu-mode.component.jade");

@Component({
  template: template,
})
export class UserMenuModeComponent extends BaseComponent {

  $root: AppComponent;
  $parent: MenuModeComponent;

  datastoreService: DatastoreService;
  requestService: RequestService;

  globalUsers: GlobalUserEntity[];

  data(): any {
    return _.assign(super.data(), {
      datastoreService: kernel.get(DatastoreService),
      requestService: kernel.get(RequestService),
      globalUsers: null,
    });
  }

  ready(): Promise<void> {
    return super.ready().then(() => {
      return this.reload();
    }).then(() => {
      return this.requestService.loadAuth();
    }).then(loadGlobalUser => {
      if (!loadGlobalUser) return Promise.resolve();
      let globalUser = _.find(this.globalUsers, {"_id": loadGlobalUser._id});
      return this.select(globalUser);
    }).then(() => {
      this.$root.reload();
    });
  }

  reload(): Promise<void> {
    return this.requestService.find<GlobalUserEntity>(GlobalUserEntity).then(globalUsers => {
      this.globalUsers = globalUsers;
    });
  }

  select(globalUser: GlobalUserEntity): Promise<void> {
    return this.requestService.changeAuth(globalUser).then(() => {
      this.datastoreService.globalUser = globalUser;
    }).then(() => {
      this.$root.reload();
    });
  }

  add(sandbox: boolean): Promise<void> {
    let token = prompt(`Input developer token (${sandbox ? "sandbox" : "production"})`);
    return this.requestService.tokenAuth(sandbox, token).then(globalUser => {
      this.datastoreService.globalUser = globalUser;
      return this.reload();
    }).catch(err => {
      alert(`Add user failed. err="${err}"`);
    });
  }

  logout(): Promise<void> {
    return this.requestService.logoutAuth().then(() => {
      this.select(null);
    });
  }

}
