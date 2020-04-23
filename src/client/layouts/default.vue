<template lang="pug">
section.app
  navigation
  // filter-modal
  // person-modal
  // progress-modal
  nuxt
</template>

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

.button--green {
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #3b8070;
  color: #3b8070;
  text-decoration: none;
  padding: 10px 30px;
}

.button--green:hover {
  color: #fff;
  background-color: #3b8070;
}

.button--grey {
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #35495e;
  color: #35495e;
  text-decoration: none;
  padding: 10px 30px;
  margin-left: 15px;
}

.button--grey:hover {
  color: #fff;
  background-color: #35495e;
}

@media screen {
  section.app {
    padding-top: 56px;
  }
}
</style>

<script lang="ts">
import { Component } from "nuxt-property-decorator";
import Navigation from "~/src/client/components/navigation.component.vue";
import BaseComponent from "~/src/client/components/base.component";

@Component({
  components: {
    Navigation,
  },
})
export default class extends BaseComponent {
  // TODO: 書き換え
  isReady: boolean = false;
  showMenu: boolean = false;

  async mounted(): Promise<void> {
    // await this.datastoreService.initialize();
    // this.$on("reload", () => this.reload());
    // await this.pushService.initialize(this);
    // this.isReady = true;
  }

  reload() {
    // this.$refs.main.reload();
  }
}
</script>
