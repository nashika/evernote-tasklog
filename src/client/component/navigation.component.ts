import Component from "vue-class-component";

import {BaseComponent} from "./base.component";
import {AppComponent} from "./app.component";
import {DatastoreService} from "../service/datastore.service";
import {container} from "../inversify.config";

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

  datastoreService: DatastoreService = container.get(DatastoreService);

  navCollapse: boolean = true;

  reload() {
    this.navCollapse = true;
    this.$root.reload();
  }

  changeMode(mode: string) {
    this.datastoreService.clear();
    this.mode = mode;
  }

}
