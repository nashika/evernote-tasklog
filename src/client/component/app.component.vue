<template lang="pug">
  section.app
    router-view(v-if="isReady", ref="main")
    app-navigation
    app-progress
</template>

<script lang="ts" src="./app.component.ts"></script>
