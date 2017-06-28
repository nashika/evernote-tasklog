import Component from "vue-class-component";

import BaseComponent from "../base.component";
import {DatastoreService} from "../../service/datastore.service";
import {container} from "../../inversify.config";

@Component({
  components: {
    "app-filter-navigation": require("./filter-navigation/filter-navigation.component.vue"),
  },
})
export default class NavigationComponent extends BaseComponent {

  datastoreService: DatastoreService = container.get(DatastoreService);

  reload() {
    this.$root.reload();
  }

}
