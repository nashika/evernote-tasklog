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
import Logo from "~/components/Logo.vue";
import BaseComponent from "~/components/base.component";
import AttendanceSEntity from "~/server/s-entity/attendance.s-entity";

@Component({
  components: {
    Logo,
  },
})
export default class extends BaseComponent {
  // eslint-disable-next-line require-await
  async fetch() {
    console.log("AAA");
  }

  async mounted(): Promise<void> {
    await super.mounted();
    const datas = await this.$socketIoService.request("attendance::find");
    const attendances: AttendanceSEntity[] = [];
    for (const data of datas) {
      const attendance = new AttendanceSEntity();
      Object.assign(attendance, data);
      attendances.push(data);
    }
    console.log(attendances);
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
