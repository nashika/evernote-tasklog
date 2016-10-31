import Component from "vue-class-component";
import _ = require("lodash");

import {MenuComponent} from "../menu-component";
import {BaseComponent} from "../base-component";
import {kernel} from "../../inversify.config";
import {DataStoreService} from "../../service/data-store-service";
import {RequestService} from "../../service/request-service";
import {GlobalUserEntity} from "../../../common/entity/global-user-entity";

let template = require("./user-menu-component.jade");

@Component({
  template: template,
})
export class UserMenuComponent extends BaseComponent {

  $parent: MenuComponent;

  dataStoreService: DataStoreService;
  requestService: RequestService;

  globalUsers: GlobalUserEntity[];

  data(): any {
    return _.assign(super.data(), {
      dataStoreService: kernel.get(DataStoreService),
      requestService: kernel.get(RequestService),
      globalUsers: null,
    });
  }

  ready() {
    super.ready();
    this.reload();
  }

  reload(): Promise<void> {
    return this.requestService.find<GlobalUserEntity>(GlobalUserEntity).then(globalUsers => {
      this.globalUsers = globalUsers;
    });
  }

  add(sandbox: boolean): Promise<void> {
    let token = prompt(`Input developer token (${sandbox ? "sandbox" : "production"})`);
    let selected: GlobalUserEntity;
    return this.requestService.tokenAuth(sandbox, token).then(globalUser => {
      this.dataStoreService.globalUser = globalUser;
      return this.reload();
    }).catch(err => {
      alert(`Add user failed. err="${err}"`);
    });
  }

}
