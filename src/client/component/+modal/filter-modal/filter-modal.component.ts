import Component from "vue-class-component";
import * as _ from "lodash";

import BaseComponent from "../../base.component";
import {container} from "../../../inversify.config";
import {DatastoreService} from "../../../service/datastore.service";
import {NotebookEntity} from "../../../../common/entity/notebook.entity";

@Component({
  watch: {
    "datastoreService.notebooks": "reloadConditions",
    "datastoreService.filterParams.notebookGuids": "reloadCounts",
    "datastoreService.filterParams.stacks": "reloadCounts",
  },
})
export default class FilterModalComponent extends BaseComponent {

  datastoreService: DatastoreService = container.get(DatastoreService);

  stacks: Array<{ stack: string, selected: boolean }> = null;
  notebooks: Array<{ guid: string, name: string, selected: boolean }> = null;

  changed: boolean = false;
  noteCount: number = 0;
  allNoteCount: number = 0;
  loadedNoteCount: number = 0;
  allLoadedNoteCount: number = 0;

  stackFields = {
    selected: {label: "Select"},
    stack: {label: "Stack"},
  };

  notebookFields = {
    selected: {label: "Select"},
    name: {label: "Name"},
  };

  async shown(): Promise<void> {
    await this.reloadCounts();
  }

  async hidden(): Promise<void> {
    if (this.changed)
      this.$root.reload();
    this.changed = false;
  }

  toggleStack(): void {
    if (!this.stacks) {
      this.stacks = _(this.datastoreService.$vm.stacks).filter(stack => !!stack).map(stack => {
        return {stack: stack, selected: false};
      }).value();
    } else {
      this.stacks = null;
    }
  }

  toggleNotebook(): void {
    if (!this.notebooks) {
      this.notebooks = _(this.datastoreService.$vm.notebooks).map((notebook: NotebookEntity) => {
        return {guid: notebook.guid, name: notebook.name, selected: false};
      }).value();
    } else {
      this.notebooks = null;
    }
  }
/*
  async reloadConditions(): Promise<void> {
    for (let stack of this.datastoreService.$vm.stacks)
      Vue.set(this.selectedStacks, stack, false);
    for (let notebookGuid in this.datastoreService.$vm.notebooks)
      Vue.set(this.selectedNotebooks, notebookGuid, !!_.find(this.datastoreService.$vm.filterParams.notebookGuids, guid => notebookGuid == guid));
  }

  changeStack(stack: string, checked: boolean) {
    for (let notebookGuid in this.datastoreService.$vm.notebooks) {
      let notebook = this.datastoreService.$vm.notebooks[notebookGuid];
      if (notebook.stack == stack)
        Vue.set(this.selectedNotebooks, notebookGuid, checked);
    }
    this.changeNotebook();
  }

  changeNotebook(_guid: string = null) {
    this.datastoreService.$vm.filterParams.notebookGuids = _.keys(_.pickBy(this.selectedNotebooks));
    this.changed = true;
  }
*/
  async reloadCounts(): Promise<void> {
    this.noteCount = null;
    this.allNoteCount = null;
    this.loadedNoteCount = null;
    this.allLoadedNoteCount = null;
    this.noteCount = await this.datastoreService.countNotes({});
    this.allNoteCount = await this.datastoreService.countNotes({noFilter: true});
    this.loadedNoteCount = await this.datastoreService.countNotes({hasContent: true});
    this.allLoadedNoteCount = await this.datastoreService.countNotes({hasContent: true, noFilter: true});
  }

  async reParse(): Promise<void> {
    await this.datastoreService.reParse();
  }

}
