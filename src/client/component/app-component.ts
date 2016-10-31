import Component from "vue-class-component";

import {BaseComponent} from "./base-component";
import {NavigationComponent} from "./navigation-component";
import {MenuComponent} from "./menu-component";
import {SettingsComponent} from "./settings-component";
import {ProgressModalComponent} from "./progress-modal-component";
import {NotesComponent} from "./notes-component";
import {TimelineComponent} from "./timeline-component";

let template = require("./app-component.jade");

@Component({
  template: template,
  components: {
    "menu-component": MenuComponent,
    "navigation-component": NavigationComponent,
    "notes-component": NotesComponent,
    "progress-modal-component": ProgressModalComponent,
    "settings-component": SettingsComponent,
    "timeline-component": TimelineComponent,
  },
})
export class AppComponent extends BaseComponent {

  mode: string;

  data():any {
    return {
      mode: "menu",
    }
  }

}
