<template lang="pug">
  section#constraint-mode.p-3
    b-table(bordered, striped, hover, small, responsive, head-variant="inverse", foot-clone, foot-variant="default",
    :fields="fields", :items="records")
      template(slot="noteTitle", slot-scope="row")
        a(:href="'evernote:///view/' + datastoreService.$vm.user.id + '/' + datastoreService.$vm.user.shardId + '/' + row.item.noteGuid + '/' + row.item.noteGuid + '/'") {{row.item.noteTitle}}
    app-floating-action-button(enableReload)
</template>

<script lang="ts" src="./constraint-mode.component.ts"></script>
