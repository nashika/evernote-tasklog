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
import { Component } from "nuxt-property-decorator";

import { BaseComponent } from "~/src/client/components/base.component";
import { appConfigLoader } from "~/src/common/util/app-config-loader";

@Component({})
export default class PersonModalComponent extends BaseComponent {
  persons: AppConfig.IPersonConfig[] = appConfigLoader.app.persons;
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
    this.currentPersonId = this.$myStore.datastore.currentPersonId;
  }

  async hidden(): Promise<void> {
    if (this.changed) this.$root.$emit("reload");
    this.changed = false;
  }

  async select(id: number): Promise<void> {
    this.currentPersonId = id;
    this.$myStore.datastore.setCurrentPersonId(id);
    this.changed = true;
    await this.$myService.request.saveSession("currentPersonId", id);
  }
}
</script>
