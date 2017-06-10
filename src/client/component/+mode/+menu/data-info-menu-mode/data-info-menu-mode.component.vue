<template lang="pug">
  section.data-info
    h2 #[span.fa.fa-database] Data Info
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

<script lang="ts" src="./data-info-menu-mode.component.ts"></script>
