<template lang="pug">
  section.app
    app-navigation
    app-filter
    app-progress
    router-view(v-if="isReady", ref="main")
</template>

<style lang="scss">
  section.app {
    padding-top: 56px;
  }
</style>

<script lang="ts" src="./app.component.ts"></script>
