import Component from "vue-class-component";
import _ = require("lodash");
var VueStrap = require("vue-strap");

import {BaseComponent} from "./base-component";
import {DataTranscieverService} from "../service/data-transciever-service";
import {DataStoreService} from "../service/data-store-service";
import {AppComponent} from "./app-component";
import {NotebookEntity} from "../../common/entity/notebook-entity";
import {RequestService} from "../service/request-service";
import {kernel} from "../inversify.config";

let template = require("./menu-component.jade");

@Component({
  template: template,
  components: {
    vSelect: VueStrap.select,
  },
  watch: {
    "dataTranscieverService.filterParams.notebookGuids": "onWatchFilterParams",
    "dataTranscieverService.filterParams.stacks": "onWatchFilterParams",
  },
  events: {
    "reload": "reload",
  },
})
export class MenuComponent extends BaseComponent {

  $parent: AppComponent;

  dataStoreService: DataStoreService;
  dataTranscieverService: DataTranscieverService;
  requestService: RequestService;
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
      requestService: kernel.get(RequestService),
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

  ready() {
    super.ready();
    this.reload().then(() => {
      this.onWatchFilterParams();
    });
  }

  reload(): Promise<void> {
    return this.dataTranscieverService.reload({getContent: false});
  }

  onWatchFilterParams() {
    Promise.resolve().then(() => {
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

  getNotebookOptions(notebooks: {[guid: string]: NotebookEntity}): {value: string, label: string}[] {
    return _.map(notebooks, (notebook: NotebookEntity) => {
      return {value: notebook.guid, label: notebook.name};
    });
  }

  getStackOptions(stacks: string[]): {value: string, label: string}[] {
    return _.map(stacks, (stack: string) => {
      return {value: stack, label: stack};
    });
  }

  logout() {
    this.requestService.logoutAuth().then(() => {
      this.$parent.mode = "auth";
    });
  }

  reParse() {
    this.dataTranscieverService.reParse();
  }

}
