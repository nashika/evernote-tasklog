<template lang="pug">
  section.app
    app-navigation
    app-filter-modal
    app-person-modal
    app-progress-modal
    router-view(v-if="isReady", ref="main")
</template>

<style lang="scss">
  section.app {
    padding-top: 56px;
  }
</style>

<script lang="ts" src="./app.component.ts"></script>
