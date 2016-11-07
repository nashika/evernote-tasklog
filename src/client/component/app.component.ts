import Component from "vue-class-component";

import {BaseComponent} from "./base.component";
import {NavigationComponent} from "./navigation.component";
import {MenuModeComponent} from "./mode/menu-mode.component";
import {SettingsModeComponent} from "./mode/settings-mode.component";
import {ProgressModalComponent} from "./progress-modal.component";
import {NotesModeComponent} from "./mode/notes-mode.component";
import {TimelineModeComponent} from "./mode/timeline-mode.component";
import {kernel} from "../inversify.config";
import {ActivityModeComponent} from "./mode/activity-mode.component";
import {DatastoreService} from "../service/datastore.service";

let template = require("./app.component.jade");

@Component({
  template: template,
  components: {
    "menu-mode-component": MenuModeComponent,
    "timeline-mode-component": TimelineModeComponent,
    "notes-mode-component": NotesModeComponent,
    "activity-mode-component": ActivityModeComponent,
    "settings-mode-component": SettingsModeComponent,
    "navigation-component": NavigationComponent,
    "progress-modal-component": ProgressModalComponent,
  },
})
export class AppComponent extends BaseComponent {

  datastoreService: DatastoreService;

  mode: string;

  data(): any {
    return {
      datastoreService: kernel.get(DatastoreService),
      mode: "menu",
      lastUpdateCount: 0,
    }
  }

  ready(): Promise<void> {
    return super.ready().then(() => {
      setInterval(() => this.interval(), 5000);
    });
  }

  interval() {
    this.datastoreService.checkUpdateCount().then(isUpdated => {
      if (isUpdated)
        this.reload();
    });
  }

  reload() {
    this.$broadcast("reload");
  }

}
