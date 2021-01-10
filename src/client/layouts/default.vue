<template lang="pug">
section.app(v-if="initialized")
  navigation-component
  person-modal-component
  filter-modal-component
  progress-modal-component
  nuxt(ref="main")
section.initialize(v-else)
  fa.fa-pulse(:icon="['fas', 'spinner']")
  | 起動中...
</template>

<script lang="ts">
import { Component } from "nuxt-property-decorator";

import NavigationComponent from "~/src/client/components/navigation.component.vue";
import BaseComponent from "~/src/client/components/base.component";
import PersonModalComponent from "~/src/client/components/modal/person-modal.component.vue";
import FilterModalComponent from "~/src/client/components/modal/filter-modal.component.vue";
import ProgressModalComponent from "~/src/client/components/modal/progress-modal.component.vue";

@Component({
  components: {
    NavigationComponent,
    PersonModalComponent,
    FilterModalComponent,
    ProgressModalComponent,
  },
})
export default class DefaultLayoutComponent extends BaseComponent {
  initialized: boolean = false;

  async beforeCreate(): Promise<void> {
    this.$myService.push.initialize(this);
    await this.$myStore.datastore.initialize();
    this.$root.$on("reload", () => this.reload());
    this.initialized = true;
  }

  async reload(): Promise<void> {
    const mainComponent: any = this.$refs.main;
    await mainComponent.$children[0].reload();
  }
}
</script>

<style>
html {
  font-family: "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

*,
*:before,
*:after {
  box-sizing: border-box;
  margin: 0;
}

@media screen {
  section.app {
    padding-top: 56px;
  }
}

section.initialize {
  color: #888888;
  font-size: 400%;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>
