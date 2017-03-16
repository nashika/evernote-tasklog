import Component from "vue-class-component";

import {MenuModeComponent} from "../menu-mode.component";
import {BaseComponent} from "../../base.component";
import {AppComponent} from "../../app.component";
import {container} from "../../../inversify.config";
import {DatastoreService} from "../../../service/datastore.service";

let template = require("./data-info-menu-mode.component.jade");

@Component({
  template: template,
  watch: {
    "datastoreService.filterParams.notebookGuids": "reload",
    "datastoreService.filterParams.stacks": "reload",
    "datastoreService.globalUser": "reload",
  },
})
export class DataInfoMenuModeComponent extends BaseComponent {

  $root: AppComponent;
  $parent: MenuModeComponent;

  datastoreService: DatastoreService = container.get(DatastoreService);

  noteCount: number = 0;
  allNoteCount: number = 0;
  loadedNoteCount: number = 0;
  allLoadedNoteCount: number = 0;
  timeLogCount: number = 0;
  allTimeLogCount: number = 0;
  profitLogCount: number = 0;
  allProfitLogCount: number = 0;

  async mounted(): Promise<void> {
    await super.mounted();
    await this.reload();
  }

  async reParse(): Promise<void> {
    await this.datastoreService.reParse();
  }

  async reload(): Promise<void> {
    this.noteCount = null;
    this.allNoteCount = null;
    this.loadedNoteCount = null;
    this.allLoadedNoteCount = null;
    this.timeLogCount = null;
    this.allTimeLogCount = null;
    this.noteCount = await this.datastoreService.countNotes({});
    this.allNoteCount = await this.datastoreService.countNotes({noFilter: true});
    this.loadedNoteCount = await this.datastoreService.countNotes({hasContent: true});
    this.allLoadedNoteCount = await this.datastoreService.countNotes({hasContent: true, noFilter: true});
    this.timeLogCount = await this.datastoreService.countTimeLogs({});
    this.allTimeLogCount = await this.datastoreService.countTimeLogs({noFilter: true});
  }

}
