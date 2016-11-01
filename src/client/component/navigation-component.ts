import Component from "vue-class-component";
import _ = require("lodash");

import {BaseComponent} from "./base-component";
import {AppComponent} from "./app-component";
import {DataStoreService} from "../service/data-store-service";
import {kernel} from "../inversify.config";

let template = require("./navigation-component.jade");

@Component({
  template: template,
  components: {},
  props: {
    mode: {
      type: String,
      required: true,
      twoWay: true,
    },
  },
})
export class NavigationComponent extends BaseComponent {

  $parent: AppComponent;

  mode: string;

  dataStoreService: DataStoreService;

  navCollapse: boolean;

  data(): any {
    return _.assign(super.data(), {
      dataStoreService: kernel.get(DataStoreService),
      navCollapse: true,
    });
  }

  reload() {
    this.navCollapse = true;
    this.$parent.$broadcast("reload");
  }

}
