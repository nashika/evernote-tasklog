<template lang="pug">
  section.menu-mode
    .container
      h1.my-3 #[span.fa.fa-tasks] Evernote Tasklog
      .row
        .col-md-4
          app-user-menu-mode
        .col-md-4(v-if="datastoreService.globalUser")
          app-note-filter-menu-mode
        .col-md-4(v-if="datastoreService.globalUser")
          app-data-info-menu-mode
</template>

<script lang="ts" src="./menu-mode.component.ts"></script>
