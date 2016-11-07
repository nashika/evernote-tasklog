import Component from "vue-class-component";
import _ = require("lodash");
var VueStrap = require("vue-strap");

import {MenuComponent} from "../menu-component";
import {BaseComponent} from "../base-component";
import {AppComponent} from "../app-component";
import {NotebookEntity} from "../../../common/entity/notebook-entity";
import {DatastoreService} from "../../service/datastore-service";
import {kernel} from "../../inversify.config";

let template = require("./note-filter-menu-component.jade");

@Component({
  template: template,
  components: {
    vSelect: VueStrap.select,
  },
})
export class NoteFilterMenuComponent extends BaseComponent {

  $root: AppComponent;
  $parent: MenuComponent;

  datastoreService: DatastoreService;

  data(): any {
    return _.assign(super.data(), {
      datastoreService: kernel.get(DatastoreService),
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

}
