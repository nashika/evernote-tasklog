import Component from "vue-class-component";

import {BaseComponent} from "./base-component";
import {AuthComponent} from "./auth-component";
import {NavigationComponent} from "./navigation-component";
import {MenuComponent} from "./menu-component";
import {SettingsComponent} from "./settings-controller";
import {ProgressModalComponent} from "./progress-modal-component";
import {NotesComponent} from "./notes-component";
import {TimelineComponent} from "./timeline-component";

let template = require("./app-component.jade");

@Component({
  template: template,
  components: {
    "auth-component": AuthComponent,
    "menu-component": MenuComponent,
    "navigation-component": NavigationComponent,
    "notes-component": NotesComponent,
    "progress-modal-component": ProgressModalComponent,
    "settings-component": SettingsComponent,
    "timeline-component": TimelineComponent,
  },
  ready: AppComponent.prototype.onReady,
})
export class AppComponent extends BaseComponent {

  mode: string;

  data():any {
    return {
      mode: "auth",
    }
  }

  onReady() {
  }

}
