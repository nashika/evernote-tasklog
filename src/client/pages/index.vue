<template lang="pug">
  .container
    div
      logo
      h1.title evernote-tasklog
      h2.subtitle My swell Nuxt.js project
      .links
        a.button--green(href="https://nuxtjs.org/", target="_blank") Documentation
        a.button--grey(href="https://github.com/nuxt/nuxt.js", target="_blank") GitHub
</template>

<script lang="ts">
import { Component } from "nuxt-property-decorator";
import Logo from "~/src/client/components/Logo.vue";
import BaseComponent from "~/src/client/components/base.component";
import AttendanceEntity from "~/src/common/entity/attendance.entity";

@Component({
  components: {
    Logo,
  },
})
export default class extends BaseComponent {
  async fetch() {}

  async mounted(): Promise<void> {
    await super.mounted();
    this.logger.info("request start");
    const datas = await this.$socketIoService.request("attendance::find");
    const attendances: AttendanceEntity[] = [];
    for (const data of datas) {
      const attendance = new AttendanceEntity();
      Object.assign(attendance, data);
      attendances.push(attendance);
    }
    this.logger.info("request ok");
    this.logger.info(attendances);
    // await this.datastoreService.initialize();
    // this.$on("reload", () => this.reload());
    // await this.pushService.initialize(this);
    // this.isReady = true;
  }
}
</script>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: "Quicksand", "Source Sans Pro", -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
