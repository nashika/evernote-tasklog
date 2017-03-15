import Component from "vue-class-component";
import _ = require("lodash");

import {MenuModeComponent} from "../menu-mode.component";
import {BaseComponent} from "../../base.component";
import {container} from "../../../inversify.config";
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
      datastoreService: container.get(DatastoreService),
      requestService: container.get(RequestService),
      globalUsers: null,
    });
  }

  async mounted(): Promise<void> {
    await super.mounted();
    await this.reload();
    let loadGlobalUser = await this.requestService.loadAuth();
    if (!loadGlobalUser) return;
    let globalUser = _.find(this.globalUsers, {"_id": loadGlobalUser._id});
    await this.select(globalUser);
  }

  async reload(): Promise<void> {
    this.globalUsers = await this.requestService.find<GlobalUserEntity>(GlobalUserEntity);
  }

  async select(globalUser: GlobalUserEntity): Promise<void> {
    await this.requestService.changeAuth(globalUser);
    this.datastoreService.globalUser = globalUser;
    this.datastoreService.lastUpdateCount = 0;
    this.$root.interval();
  }

  async add(sandbox: boolean): Promise<void> {
    let token = prompt(`Input developer token (${sandbox ? "sandbox" : "production"})`);
    try {
      this.datastoreService.globalUser = await this.requestService.tokenAuth(sandbox, token);
      await this.reload();
    } catch (err) {
      alert(`Add user failed. err="${err}"`);
    }
  }

  async logout(): Promise<void> {
    await this.requestService.logoutAuth();
    await this.select(null);
  }

}
