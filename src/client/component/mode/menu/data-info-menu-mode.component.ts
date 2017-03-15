import Component from "vue-class-component";
import _ = require("lodash");

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

  datastoreService: DatastoreService;

  noteCount: number;
  allNoteCount: number;
  loadedNoteCount: number;
  allLoadedNoteCount: number;
  timeLogCount: number;
  allTimeLogCount: number;
  profitLogCount: number;
  allProfitLogCount: number;

  data(): any {
    return _.assign(super.data(), {
      datastoreService: container.get(DatastoreService),
      noteCount: 0,
      allNoteCount: 0,
      loadedNoteCount: 0,
      allLoadedNoteCount: 0,
      timeLogCount: 0,
      allTimeLogCount: 0,
      profitLogCount: 0,
      allProfitLogCount: 0,
    });
  }

  async ready(): Promise<void> {
    await super.ready();
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
