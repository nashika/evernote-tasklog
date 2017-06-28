<template lang="pug">
  b-modal(id="filter-modal", title="Filter")
    .row
      .col-md-6
        section.notebook-filter
          h1.h3 Notebook
          div(v-for="stack in datastoreService.stacks")
            b-form-checkbox(v-model="selectedStacks[stack]", @change="changeStack(stack, $event)") {{stack || "No Stack"}}
            div.ml-3(v-for="notebook in datastoreService.notebooks")
              b-form-checkbox(v-if="notebook.stack == stack", v-model="selectedNotebooks[notebook.guid]", @change="changeNotebook(notebook.guid)") {{notebook.name}}
        button.btn.btn-primary.btn-lg.btn-block(type="button", @click="$parent.reload()") #[span.fa.fa-refresh] Reload
      .col-md-6
        section.data-info
          h1.h3 #[span.fa.fa-database] Data Info
          .well.h3
            p #[span.fa.fa-2x.fa-files-o] {{noteCount}} notes.
          table.table.table-bordered.table-sm
            thead.thead-inverse
              tr
                th
                th Target
                th All
            tbody
              tr
                th Notes
                td.text-right {{noteCount}}
                td.text-right {{allNoteCount}}
              tr
                th Loaded Notes
                td.text-right {{loadedNoteCount}}
                td.text-right {{allLoadedNoteCount}}
              //tr
                th Time Logs
                td.text-right {{timeLogCount}}
                td.text-right {{allTimeLogCount}}
              //tr
                th Profit Logs
                td.text-right {{profitLogCount}}
                td.text-right {{allProfitLogCount}}
          button.btn.btn-primary.btn-block(type="button", @click="reParse()") #[span.fa.fa-industry] Re Parse Notes
</template>

<script lang="ts" src="./filter.component.ts"></script>
