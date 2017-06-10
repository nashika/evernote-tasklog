import Component from "vue-class-component";

import BaseComponent from "../base.component";
import {DatastoreService} from "../../service/datastore.service";
import {container} from "../../inversify.config";
import AppComponent from "../app.component";

@Component({})
export default class NavigationComponent extends BaseComponent {

  $parent: AppComponent;

  datastoreService: DatastoreService = container.get(DatastoreService);

  reload() {
    this.$root.reload();
  }

}
