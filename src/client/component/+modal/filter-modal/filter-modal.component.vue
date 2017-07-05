<template lang="pug">
  b-modal(id="filter-modal", title="Filter", ok-only, @hidden="hidden()")
    .row
      .col-md-6
        section.notebook-filter
          h1.h3 Notebook
          div(v-for="stack in datastoreService.stacks")
            label.custom-control.custom-checkbox
              input.custom-control-input(type="checkbox", v-model="selectedStacks[stack]", @change="changeStack(stack, $event)")
              span.custom-control-indicator
              span.custom-control-description {{stack || "No Stack"}}
            //b-form-checkbox(v-model="selectedStacks[stack]", @change="changeStack(stack, $event)")
            div.ml-3(v-for="notebook in datastoreService.notebooks")
              template(v-if="notebook.stack == stack")
                label.custom-control.custom-checkbox
                  input.custom-control-input(type="checkbox", v-model="selectedNotebooks[notebook.guid]", @change="changeNotebook(notebook.guid)")
                  span.custom-control-indicator
                  span.custom-control-description {{notebook.name}}
                //b-form-checkbox(v-model="selectedNotebooks[notebook.guid]", @change="changeNotebook(notebook.guid)") {{notebook.name}}
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

<script lang="ts" src="./filter-modal.component.ts"></script>
