<template lang="pug">
  section#constraint-mode.p-3
    b-table(bordered, striped, hover, small, responsive, head-variant="inverse", foot-clone, foot-variant="default",
    :fields="fields", :items="records")
      template(slot="action", scope="row")
        b-button(size="sm", variant="success", @click="createNote(row.item)") {{$t("verb.create", [$t("common.note")])}}
    app-floating-action-button(enableReload)
</template>

<script lang="ts" src="./repetition-mode.component.ts"></script>
