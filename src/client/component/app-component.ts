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
import {SyncStateEntity} from "../../common/entity/sync-state-entity";

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

  requestService: RequestService;

  mode: string;
  lastSyncState: SyncStateEntity;

  data(): any {
    return {
      requestService: kernel.get(RequestService),
      mode: "menu",
      lastSyncState: null,
    }
  }

  ready(): Promise<void> {
    return super.ready().then(() => {
      setInterval(() => this.interval(), 5000);
    });
  }

  interval() {
    this.requestService.findOne<SyncStateEntity>(SyncStateEntity).then(syncState => {
      if (!this.lastSyncState) return;
      if (this.lastSyncState.updateCount == syncState.updateCount) return;
      this.$broadcast("reload");
    });
  }

}
