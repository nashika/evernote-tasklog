import Component from "vue-class-component";
import _ = require("lodash");

import {MenuModeComponent} from "../menu-mode.component";
import {BaseComponent} from "../../base.component";
import {AppComponent} from "../../app.component";
import {DatastoreService} from "../../../service/datastore.service";
import {container} from "../../../inversify.config";
import * as Vue from "vue";

let template = require("./note-filter-menu-mode.component.jade");

@Component({
  template: template,
  watch: {
    "datastoreService.notebooks": "reload",
  },
})
export class NoteFilterMenuModeComponent extends BaseComponent {

  $root: AppComponent;
  $parent: MenuModeComponent;

  datastoreService: DatastoreService = container.get(DatastoreService);

  selectedStacks: {[stack: string]: boolean} = {};
  selectedNotebooks: {[guid: string]: boolean} = {};

  async reload(): Promise<void> {
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

}
