<template lang="pug">
  section.menu-mode(v-if="showMenu")
    h1.my-3 #[span.fa.fa-tasks] Evernote Tasklog
    //app-note-filter-menu-mode
    //app-data-info-menu-mode
</template>

<script lang="ts" src="./menu.component.ts"></script>
