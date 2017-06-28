import Component from "vue-class-component";
import * as Vue from "vue";
import * as _ from "lodash";

import BaseComponent from "../../base.component";
import {container} from "../../../inversify.config";
import {DatastoreService} from "../../../service/datastore.service";

@Component({
  watch: {
    "datastoreService.notebooks": "reloadConditions",
    "datastoreService.filterParams.notebookGuids": "reloadCounts",
    "datastoreService.filterParams.stacks": "reloadCounts",
  },
})
export default class FilterModalComponent extends BaseComponent {

  datastoreService: DatastoreService = container.get(DatastoreService);

  selectedStacks: {[stack: string]: boolean} = {};
  selectedNotebooks: {[guid: string]: boolean} = {};

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
    await this.reloadCounts();
  }

  async reloadConditions(): Promise<void> {
    for (let stack of this.datastoreService.stacks)
      Vue.set(this.selectedStacks, stack, false);
    for (let notebookGuid in this.datastoreService.notebooks)
      Vue.set(this.selectedNotebooks, notebookGuid, !!_.find(this.datastoreService.filterParams.notebookGuids, guid => notebookGuid == guid));
  }

  changeStack(stack: string, checked: boolean) {
    for (let notebookGuid in this.datastoreService.notebooks) {
      let notebook = this.datastoreService.notebooks[notebookGuid];
      if (notebook.stack == stack)
        Vue.set(this.selectedNotebooks, notebookGuid, checked);
    }
    this.changeNotebook();
  }

  changeNotebook(_guid: string = null) {
    this.datastoreService.filterParams.notebookGuids = _.keys(_.pickBy(this.selectedNotebooks));
    console.log(this.datastoreService.filterParams.notebookGuids)
  }

  async reloadCounts(): Promise<void> {
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

  async reParse(): Promise<void> {
    await this.datastoreService.reParse();
  }

}
