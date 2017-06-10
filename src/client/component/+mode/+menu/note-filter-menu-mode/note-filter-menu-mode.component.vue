<template lang="pug">
  section.note-filter
    h1.h2 #[span.fa.fa-search] Note Filter
    section.notebook-filter
      h1.h3 Notebook
      div(v-for="stack in datastoreService.stacks")
        b-form-checkbox(v-model="selectedStacks[stack]", @change="changeStack(stack, $event)") {{stack || "No Stack"}}
        div.ml-3(v-for="notebook in datastoreService.notebooks")
          b-form-checkbox(v-if="notebook.stack == stack", v-model="selectedNotebooks[notebook.guid]", @change="changeNotebook(notebook.guid)") {{notebook.name}}
    button.btn.btn-primary.btn-lg.btn-block(type="button", @click="$parent.reload()") #[span.fa.fa-refresh] Reload
</template>

<script lang="ts" src="./note-filter-menu-mode.component.ts"></script>
