import Component from "vue-class-component";

import {BaseComponent} from "./base.component";
import {AppComponent} from "./app.component";
import {DatastoreService} from "../service/datastore.service";
import {container} from "../inversify.config";

let template = require("./navigation.component.jade");

@Component({
  template: template,
})
export class NavigationComponent extends BaseComponent {

  $root: AppComponent;
  $parent: AppComponent;

  datastoreService: DatastoreService = container.get(DatastoreService);

  navCollapse: boolean = true;

  reload() {
    this.navCollapse = true;
    this.$root.reload();
  }

}
