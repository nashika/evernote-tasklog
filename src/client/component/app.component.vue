<template lang="pug">
  section.app
    app-navigation(:showMenu="showMenu", @toggle-menu="toggleMenu")
    app-progress
    app-menu(:showMenu="showMenu", @toggle-menu="toggleMenu")
    router-view(v-if="isReady", ref="main")
</template>

<style lang="scss">
  section.app {
    padding-top: 56px;
  }
</style>

<script lang="ts" src="./app.component.ts"></script>
