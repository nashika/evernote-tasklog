import Component from "vue-class-component";

import BaseComponent from "../../base.component";
import {container} from "../../../inversify.config";
import {DatastoreService} from "../../../service/datastore.service";

@Component({
  components: {
    "app-user-menu-mode": require("../+menu/user-menu-mode/user-menu-mode.component.vue"),
    "app-note-filter-menu-mode": require("../+menu/note-filter-menu-mode/note-filter-menu-mode.component.vue"),
    "app-data-info-menu-mode": require("../+menu/data-info-menu-mode/data-info-menu-mode.component.vue"),
  },
})
export default class MenuModeComponent extends BaseComponent {

  datastoreService: DatastoreService = container.get(DatastoreService);

  async mounted(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    if (this.datastoreService.globalUser)
      await this.datastoreService.reload({getContent: false});
  }

}
