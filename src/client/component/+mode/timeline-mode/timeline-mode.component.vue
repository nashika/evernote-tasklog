<template lang="pug">
  section#timeline-mode
    #timeline
    app-floating-action-button(enableReload, enableFilter, :filterParams="filterParams", @changeFilter="reload($event)")
</template>

<script lang="ts" src="./timeline-mode.component.ts"></script>
