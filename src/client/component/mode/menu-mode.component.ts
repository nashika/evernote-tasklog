import Component from "vue-class-component";
import _ = require("lodash");

import {BaseComponent} from "../base.component";
import {AppComponent} from "../app.component";
import {container} from "../../inversify.config";
import {UserMenuModeComponent} from "./menu/user-menu-mode.component";
import {NoteFilterMenuModeComponent} from "./menu/note-filter-menu-mode.component";
import {DataInfoMenuModeComponent} from "./menu/data-info-menu-mode.component";
import {DatastoreService} from "../../service/datastore.service";

let template = require("./menu-mode.component.jade");

@Component({
  template: template,
  components: {
    "user-menu-component": UserMenuModeComponent,
    "note-filter-menu-component": NoteFilterMenuModeComponent,
    "data-info-menu-component": DataInfoMenuModeComponent,
  },
  events: {
    reload: "reload",
  },
})
export class MenuModeComponent extends BaseComponent {

  $parent: AppComponent;

  datastoreService: DatastoreService;

  data(): any {
    return _.assign(super.data(), {
      datastoreService: container.get(DatastoreService),
    });
  }

  async reload(): Promise<void> {
    await this.datastoreService.reload({getContent: false});
  }

}
