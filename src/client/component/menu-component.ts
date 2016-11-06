import Component from "vue-class-component";
import _ = require("lodash");

import {BaseComponent} from "./base-component";
import {DataTranscieverService} from "../service/data-transciever-service";
import {AppComponent} from "./app-component";
import {kernel} from "../inversify.config";
import {UserMenuComponent} from "./menu/user-menu-component";
import {NoteFilterMenuComponent} from "./menu/note-filter-menu-component";
import {DataInfoMenuComponent} from "./menu/data-info-menu-component";
import {DataStoreService} from "../service/data-store-service";

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

  dataStoreService: DataStoreService;
  dataTranscieverService: DataTranscieverService;

  data(): any {
    return _.assign(super.data(), {
      dataStoreService: kernel.get(DataStoreService),
      dataTranscieverService: kernel.get(DataTranscieverService),
    });
  }

  reload(): Promise<void> {
    return this.dataTranscieverService.reload({getContent: false});
  }

}
