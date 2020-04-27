<template lang="pug">
b-modal(id="person-modal", title="Person", ok-only, @shown="shown()", @hidden="hidden()")
  b-table(striped, hover, :items="persons", :fields="fields")
    template(v-slot:cell(action)="data")
      template(v-if="currentPersonId == data.item.id")
        b-button(block, variant="danger") Selected
      template(v-else)
        b-button(block, variant="secondary", @click="select(data.item.id)") Select
  .my-3(v-if="currentPersonId")
    b-button(block, variant="secondary", @click="select(0)") Unselect Person
</template>

<script lang="ts">
import Component from "vue-class-component";

import BaseComponent from "~/src/client/components/base.component";
import configLoader from "~/src/common/util/config-loader";

@Component({})
export default class PersonModalComponent extends BaseComponent {
  persons: AppConfig.IPersonConfig[] = configLoader.app.persons;
  currentPersonId: number = 0;
  changed: boolean = false;

  fields = [
    {
      key: "id",
      label: "ID",
      sortable: true,
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
    },
    {
      key: "action",
      label: "Action",
    },
  ];

  async shown(): Promise<void> {
    this.currentPersonId = this.$datastoreService.$vm.currentPersonId;
  }

  async hidden(): Promise<void> {
    if (this.changed) this.$myStore.datastore.startReload();
    this.changed = false;
  }

  async select(id: number): Promise<void> {
    this.currentPersonId = id;
    this.$datastoreService.$vm.currentPersonId = id;
    this.changed = true;
    await this.$requestService.saveSession("currentPersonId", id);
  }
}
</script>
