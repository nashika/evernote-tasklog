import Component from "vue-class-component";
import * as _ from "lodash";

import BaseComponent from "../../base.component";
import {container} from "../../../inversify.config";
import {DatastoreService, IDatastoreServiceNoteFilterParams} from "../../../service/datastore.service";
import {NotebookEntity} from "../../../../common/entity/notebook.entity";

interface IStackItem {
  stack: string;
  selected: boolean;
}

interface INotebookItem {
  guid: string;
  name: string;
  selected: boolean;
}

@Component({})
export default class FilterModalComponent extends BaseComponent {

  datastoreService: DatastoreService = container.get(DatastoreService);

  noteFilterParams: IDatastoreServiceNoteFilterParams;
  stacks: IStackItem[] = null;
  notebooks: INotebookItem[] = null;

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
    await this.reloadCount();
  }

  async hidden(): Promise<void> {
    if (this.changed)
      this.$root.reload();
    this.$root.$emit("filter-modal::change", this.noteFilterParams);
    this.changed = false;
  }

  async toggleStack(): Promise<void> {
    if (!this.stacks) {
      this.stacks = _(this.datastoreService.$vm.stacks).filter(stack => !!stack).map(stack => {
        return {stack: stack, selected: false};
      }).value();
    } else {
      this.stacks = null;
    }
    await this.reloadCount();
  }

  async toggleStackItem(stack: IStackItem): Promise<void> {
    stack.selected = !stack.selected;
    await this.reloadCount();
  }

  async toggleNotebook(): Promise<void> {
    if (!this.notebooks) {
      this.notebooks = _(this.datastoreService.$vm.notebooks).map((notebook: NotebookEntity) => {
        return {guid: notebook.guid, name: notebook.name, selected: false};
      }).value();
    } else {
      this.notebooks = null;
    }
    await this.reloadCount();
  }

  async toggleNotebookItem(notebook: INotebookItem): Promise<void> {
    notebook.selected = !notebook.selected;
    await this.reloadCount();
  }

  reloadConditions(): void {
    this.noteFilterParams = {};
    this.noteFilterParams.stacks = _(this.stacks).filter(stack => stack.selected).map(stack => stack.stack).value();
    this.noteFilterParams.notebookGuids = _(this.notebooks).filter(notebook => notebook.selected).map(notebook => notebook.guid).value();
  }

  async reloadCount(): Promise<void> {
    this.reloadConditions();
    this.noteCount = null;
    this.allNoteCount = null;
    this.loadedNoteCount = null;
    this.allLoadedNoteCount = null;
    this.noteCount = await this.datastoreService.countNotes(this.noteFilterParams);
    this.allNoteCount = await this.datastoreService.countNotes({});
    let hasContentFilterParams = _.clone(this.noteFilterParams);
    hasContentFilterParams.hasContent = true;
    this.loadedNoteCount = await this.datastoreService.countNotes(hasContentFilterParams);
    this.allLoadedNoteCount = await this.datastoreService.countNotes({hasContent: true});
  }

  async reParse(): Promise<void> {
    await this.datastoreService.reParse();
  }

}
