import Component from "vue-class-component";
import _ = require("lodash");

import {MenuComponent} from "../menu-component";
import {BaseComponent} from "../base-component";
import {AppComponent} from "../app-component";
import {DataTranscieverService} from "../../service/data-transciever-service";
import {kernel} from "../../inversify.config";
import {DataStoreService} from "../../service/data-store-service";

let template = require("./data-info-menu-component.jade");

@Component({
  template: template,
  watch: {
    "dataTranscieverService.filterParams.notebookGuids": "reload",
    "dataTranscieverService.filterParams.stacks": "reload",
    "dataStoreService.globalUser": "reload",
  },
})
export class DataInfoMenuComponent extends BaseComponent {

  $root: AppComponent;
  $parent: MenuComponent;

  dataStoreService: DataStoreService;
  dataTranscieverService: DataTranscieverService;

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
      dataStoreService: kernel.get(DataStoreService),
      dataTranscieverService: kernel.get(DataTranscieverService),
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

  ready(): Promise<void> {
    return super.ready().then(() => {
      return this.reload();
    })
  }

  reParse() {
    this.dataTranscieverService.reParse();
  }

  reload(): Promise<void> {
    this.noteCount = null;
    this.allNoteCount = null;
    this.loadedNoteCount = null;
    this.allLoadedNoteCount = null;
    this.timeLogCount = null;
    this.allTimeLogCount = null;
    return Promise.resolve().then(() => {
      return this.dataTranscieverService.countNotes({}).then(count => {
        this.noteCount = count;
      });
    }).then(() => {
      return this.dataTranscieverService.countNotes({noFilter: true}).then(count => {
        this.allNoteCount = count;
      });
    }).then(() => {
      return this.dataTranscieverService.countNotes({hasContent: true}).then(count => {
        this.loadedNoteCount = count;
      });
    }).then(() => {
      return this.dataTranscieverService.countNotes({hasContent: true, noFilter: true}).then(count => {
        this.allLoadedNoteCount = count;
      });
    }).then(() => {
      return this.dataTranscieverService.countTimeLogs({}).then(count => {
        this.timeLogCount = count;
      });
    }).then(() => {
      return this.dataTranscieverService.countTimeLogs({noFilter: true}).then(count => {
        this.allTimeLogCount = count;
      });
    });
  }

}
