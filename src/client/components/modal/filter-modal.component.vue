<template lang="pug">
b-modal(id="filter-modal", title="Filter", ok-only, @shown="shown()", @hidden="hidden()")
  .mb-3
    span.mr-2 Notes count&nbsp;
      b-badge(variant="primary") {{noteCount}}
      | &nbsp;/&nbsp;
      b-badge {{allNoteCount}}
    span.mr-2 (Loaded&nbsp;
      b-badge(variant="primary") {{loadedNoteCount}}
      | &nbsp;/&nbsp;
      b-badge {{allLoadedNoteCount}}
      |)
    b-button(variant="danger", size="sm", @click="reParse()") #[span.fa.fa-industry] Re Parse
  .mb-3
    .h6 Filter by stack
    .scroll(v-if="stacks")
      b-table(:items="stacks", :fields="stackFields", striped, small)
        template(v-slot:cell(selected)="data")
          b-form-checkbox(:checked="data.item.selected", @change="toggleStackItem(data.item)")
  .mb-3
    .h6 Filter by notebook
    .scroll(v-if="notebooks")
      b-table(:items="notebooks", :fields="notebookFields", striped, small)
        template(v-slot:cell(selected)="data")
          b-form-checkbox(:checked="data.item.selected", @change="toggleNotebookItem(data.item)")
</template>

<style lang="scss">
.scroll {
  overflow-y: auto;
  max-height: 200px;
}
</style>

<script lang="ts">
import { Component } from "nuxt-property-decorator";
import _ from "lodash";

import BaseComponent from "~/src/client/components/base.component";
import { IDatastoreServiceNoteFilterParams } from "~/src/client/service/datastore.service";
import NotebookEntity from "~/src/common/entity/notebook.entity";

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
  filterParams: IDatastoreServiceNoteFilterParams = {};
  stacks: IStackItem[] | null = null;
  notebooks: INotebookItem[] | null = null;

  changed: boolean = false;
  noteCount: number = 0;
  allNoteCount: number = 0;
  loadedNoteCount: number = 0;
  allLoadedNoteCount: number = 0;

  stackFields = [
    {
      key: "selected",
      label: "選択",
    },
    {
      key: "stack",
      label: "スタック",
    },
  ];

  notebookFields = [
    {
      key: "selected",
      label: "選択",
    },
    {
      key: "name",
      label: "ノートブック名",
    },
  ];

  async mounted(): Promise<void> {
    await super.mounted();
    this.$root.$on(
      "filter-modal::show",
      (filterParams: IDatastoreServiceNoteFilterParams) =>
        this.show(filterParams)
    );
  }

  async show(filterParams: IDatastoreServiceNoteFilterParams): Promise<void> {
    this.filterParams = filterParams;
    this.stacks = _(this.$datastoreService.$vm.stacks)
      .filter(stack => !!stack)
      .map(stack => {
        return {
          stack,
          selected: !!_.find(
            this.filterParams.stacks,
            filterStack => stack === filterStack
          ),
        };
      })
      .value();
    this.notebooks = _(this.$datastoreService.$vm.notebooks)
      .map((notebook: NotebookEntity) => {
        return {
          guid: notebook.guid,
          name: notebook.name,
          selected: !!_.find(
            this.filterParams.notebookGuids,
            notebookGuid => notebook.guid === notebookGuid
          ),
        };
      })
      .value();
    this.$root.$emit("bv::show::modal", "filter-modal");
  }

  async shown(): Promise<void> {
    await this.reloadCount();
  }

  async hidden(): Promise<void> {
    if (this.changed) this.$root.$emit("reload");
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
    this.filterParams.stacks = _(this.stacks)
      .filter(stack => stack.selected)
      .map(stack => stack.stack)
      .value();
    this.filterParams.notebookGuids = _(this.notebooks)
      .filter(notebook => notebook.selected)
      .map(notebook => notebook.guid)
      .value();
  }

  async reloadCount(): Promise<void> {
    this.reloadConditions();
    this.noteCount = 0;
    this.allNoteCount = 0;
    this.loadedNoteCount = 0;
    this.allLoadedNoteCount = 0;
    this.noteCount = await this.$datastoreService.countNotes(this.filterParams);
    this.allNoteCount = await this.$datastoreService.countNotes({});
    const hasContentFilterParams = _.clone(this.filterParams);
    hasContentFilterParams.hasContent = true;
    this.loadedNoteCount = await this.$datastoreService.countNotes(
      hasContentFilterParams
    );
    this.allLoadedNoteCount = await this.$datastoreService.countNotes({
      hasContent: true,
    });
  }

  async reParse(): Promise<void> {
    await this.$datastoreService.reParse();
  }
}
</script>
