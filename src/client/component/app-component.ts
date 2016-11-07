import Component from "vue-class-component";

import {BaseComponent} from "./base-component";
import {NavigationComponent} from "./navigation-component";
import {MenuComponent} from "./menu-component";
import {SettingsComponent} from "./settings-component";
import {ProgressModalComponent} from "./progress-modal-component";
import {NotesComponent} from "./notes-component";
import {TimelineComponent} from "./timeline-component";
import {RequestService} from "../service/request-service";
import {kernel} from "../inversify.config";
import {ActivityComponent} from "./activity-component";

let template = require("./app-component.jade");

@Component({
  template: template,
  components: {
    "menu-component": MenuComponent,
    "navigation-component": NavigationComponent,
    "progress-modal-component": ProgressModalComponent,
    "timeline-component": TimelineComponent,
    "notes-component": NotesComponent,
    "activity-component": ActivityComponent,
    "settings-component": SettingsComponent,
  },
})
export class AppComponent extends BaseComponent {

  requestService: RequestService;

  mode: string;
  lastUpdateCount: number;

  data(): any {
    return {
      requestService: kernel.get(RequestService),
      mode: "menu",
      lastUpdateCount: 0,
    }
  }

  ready(): Promise<void> {
    return super.ready().then(() => {
      setInterval(() => this.interval(), 5000);
    });
  }

  reload() {
    this.$broadcast("reload");
  }

  interval() {
    this.requestService.getUpdateCount().then(updateCount => {
      if (!this.lastUpdateCount) {
        this.lastUpdateCount = updateCount;
      } else {
        if (this.lastUpdateCount == updateCount) return;
        this.lastUpdateCount = updateCount;
        this.reload();
      }
    });
  }

}
