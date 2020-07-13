<template lang="pug">
  nav#actions
    #menu-button.action.rounded-circle(v-if="enableMenu", @click="$bvModal.show('menu-modal')")
      fa(:icon="['fas', 'bars']")
    #filter-button.action.rounded-circle(v-if="enableFilter", @click="showFilterModal()")
      fa(:icon="['fas', 'filter']")
    #reload-button.action.rounded-circle(v-if="enableReload", @click="$root.$emit('reload')")
      fa(:icon="['fas', 'sync']")
</template>

<style lang="scss">
@import "../scss/lib";

nav#actions {
  position: fixed;
  bottom: 0;
  right: 0;
  padding: 10px;
  z-index: 100;

  .action {
    display: flex;
    margin: 10px;
    width: 40px;
    height: 40px;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    color: white;
    opacity: 0.8;
    cursor: pointer;
    background-color: theme-color("info");
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.5);

    &,
    &::before,
    &::after {
      transition: all 0.5s;
    }

    &:hover {
      background-color: $brand-primary;
    }
  }
}
</style>

<script lang="ts">
import { Component, Prop } from "nuxt-property-decorator";

import BaseComponent from "~/src/client/components/base.component";
import { IDatastoreServiceNoteFilterParams } from "~/src/client/store/datastore";

@Component
export default class FloatingActionButtonComponent extends BaseComponent {
  @Prop({ type: Boolean, default: false })
  enableReload!: boolean;

  @Prop({ type: Boolean, default: false })
  enableFilter!: boolean;

  @Prop({ type: Boolean, default: false })
  enableMenu!: boolean;

  @Prop({ type: Object })
  filterParams!: IDatastoreServiceNoteFilterParams;

  async mounted(): Promise<void> {
    await super.mounted();
    this.$root.$on(
      "filter-modal::hide",
      (param: IDatastoreServiceNoteFilterParams) => this.hideFilterModal(param)
    );
  }

  showFilterModal() {
    this.$root.$emit("filter-modal::show", this.filterParams);
  }

  hideFilterModal(param: IDatastoreServiceNoteFilterParams) {
    this.$emit("changeFilter", param);
  }
}
</script>
