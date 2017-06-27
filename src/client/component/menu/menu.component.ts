import Component from "vue-class-component";

import BaseComponent from "../base.component";
import {container} from "../../inversify.config";
import {DatastoreService} from "../../service/datastore.service";

@Component({
  components: {
    //"app-note-filter-menu-mode": require("../+menu/note-filter-menu-mode/note-filter-menu-mode.component.vue"),
    //"app-data-info-menu-mode": require("../+menu/data-info-menu-mode/data-info-menu-mode.component.vue"),
  },
  props: {
    showMenu: Boolean,
  },
})
export default class MenuComponent extends BaseComponent {

  datastoreService: DatastoreService = container.get(DatastoreService);

  showMenu: boolean = false;

  async mounted(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    await this.datastoreService.reload({getContent: false});
  }

}
