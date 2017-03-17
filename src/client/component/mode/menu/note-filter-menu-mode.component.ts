import Component from "vue-class-component";
import _ = require("lodash");

import {MenuModeComponent} from "../menu-mode.component";
import {BaseComponent} from "../../base.component";
import {AppComponent} from "../../app.component";
import {NotebookEntity} from "../../../../common/entity/notebook.entity";
import {DatastoreService} from "../../../service/datastore.service";
import {container} from "../../../inversify.config";

let template = require("./note-filter-menu-mode.component.jade");

@Component({
  template: template,
})
export class NoteFilterMenuModeComponent extends BaseComponent {

  $root: AppComponent;
  $parent: MenuModeComponent;

  datastoreService: DatastoreService = container.get(DatastoreService);

  getNotebookOptions(notebooks: {[guid: string]: NotebookEntity}): {value: string, text: string}[] {
    return _.map(notebooks, (notebook: NotebookEntity) => {
      return {value: notebook.guid, text: notebook.name};
    });
  }

  getStackOptions(stacks: string[]): {value: string, text: string}[] {
    return _.map(stacks, (stack: string) => {
      return {value: stack, text: stack};
    });
  }

}
