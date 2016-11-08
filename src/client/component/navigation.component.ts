import Component from "vue-class-component";
import _ = require("lodash");

import {BaseComponent} from "./base.component";
import {AppComponent} from "./app.component";
import {DatastoreService} from "../service/datastore.service";
import {kernel} from "../inversify.config";

let template = require("./navigation.component.jade");

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

  $root: AppComponent;
  $parent: AppComponent;

  mode: string;

  datastoreService: DatastoreService;

  navCollapse: boolean;

  data(): any {
    return _.assign(super.data(), {
      datastoreService: kernel.get(DatastoreService),
      navCollapse: true,
    });
  }

  reload() {
    this.navCollapse = true;
    this.$root.reload();
  }

  changeMode(mode: string) {
    this.datastoreService.clear();
    this.mode = mode;
  }

}
