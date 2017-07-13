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

  filterParams: IDatastoreServiceNoteFilterParams;
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

  async mounted(): Promise<void> {
    await super.mounted();
    this.$root.$on("filter-modal::show", (filterParams: IDatastoreServiceNoteFilterParams) => this.show(filterParams));
  }

  async show(filterParams: IDatastoreServiceNoteFilterParams): Promise<void> {
    this.filterParams = filterParams;
    this.stacks = _(this.datastoreService.$vm.stacks).filter(stack => !!stack).map(stack => {
      return {stack: stack, selected: !!_.find(this.filterParams.stacks, filterStack => stack == filterStack)};
    }).value();
    this.notebooks = _(this.datastoreService.$vm.notebooks).map((notebook: NotebookEntity) => {
      return {
        guid: notebook.guid,
        name: notebook.name,
        selected: !!_.find(this.filterParams.notebookGuids, notebookGuid => notebook.guid == notebookGuid)
      };
    }).value();
    this.$root.$emit("show::modal", "filter-modal");
  }

  async shown(): Promise<void> {
    await this.reloadCount();
  }

  async hidden(): Promise<void> {
    if (this.changed)
      this.$root.reload();
    this.$root.$emit("filter-modal::hide", this.filterParams);
    this.changed = false;
  }

  async toggleStackItem(stack: IStackItem): Promise<void> {
    stack.selected = !stack.selected;
    await this.reloadCount();
  }

  async toggleNotebookItem(notebook: INotebookItem): Promise<void> {
    notebook.selected = !notebook.selected;
    await this.reloadCount();
  }

  reloadConditions(): void {
    this.filterParams = {};
    this.filterParams.stacks = _(this.stacks).filter(stack => stack.selected).map(stack => stack.stack).value();
    this.filterParams.notebookGuids = _(this.notebooks).filter(notebook => notebook.selected).map(notebook => notebook.guid).value();
  }

  async reloadCount(): Promise<void> {
    this.reloadConditions();
    this.noteCount = null;
    this.allNoteCount = null;
    this.loadedNoteCount = null;
    this.allLoadedNoteCount = null;
    this.noteCount = await this.datastoreService.countNotes(this.filterParams);
    this.allNoteCount = await this.datastoreService.countNotes({});
    let hasContentFilterParams = _.clone(this.filterParams);
    hasContentFilterParams.hasContent = true;
    this.loadedNoteCount = await this.datastoreService.countNotes(hasContentFilterParams);
    this.allLoadedNoteCount = await this.datastoreService.countNotes({hasContent: true});
  }

  async reParse(): Promise<void> {
    await this.datastoreService.reParse();
  }

}
