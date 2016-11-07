import Component from "vue-class-component";
import _ = require("lodash");

import {BaseComponent} from "./base-component";
import {AppComponent} from "./app-component";
import {kernel} from "../inversify.config";
import {UserMenuComponent} from "./menu/user-menu-component";
import {NoteFilterMenuComponent} from "./menu/note-filter-menu-component";
import {DataInfoMenuComponent} from "./menu/data-info-menu-component";
import {DatastoreService} from "../service/datastore-service";

let template = require("./menu-component.jade");

@Component({
  template: template,
  components: {
    "user-menu-component": UserMenuComponent,
    "note-filter-menu-component": NoteFilterMenuComponent,
    "data-info-menu-component": DataInfoMenuComponent,
  },
  events: {
    reload: "reload",
  },
})
export class MenuComponent extends BaseComponent {

  $parent: AppComponent;

  datastoreService: DatastoreService;

  data(): any {
    return _.assign(super.data(), {
      datastoreService: kernel.get(DatastoreService),
    });
  }

  reload(): Promise<void> {
    return this.datastoreService.reload({getContent: false});
  }

}
