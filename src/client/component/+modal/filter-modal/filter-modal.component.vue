<template lang="pug">
  b-modal(id="filter-modal", title="Filter", ok-only, @shown="shown()", @hidden="hidden()")
    .mb-3
      span.mr-2 Notes count&nbsp;
        b-badge(variant="primary") {{noteCount}}
        | &nbsp;/&nbsp;
        b-badge {{allNoteCount}}
      span.mr-2 (Loaded&nbsp;
        b-badge(variant="primary") {{loadedNoteCount}}
        | &nbsp;/&nbsp;
        b-badge {{allLoadedNoteCount}}
        |)
      b-button(variant="danger", size="sm", @click="reParse()") #[span.fa.fa-industry] Re Parse
    .mb-3
      b-form-checkbox(:checked="!!stacks", @change="toggleStack()") Filter by stack
      b-table(v-if="stacks", :items="stacks", :fields="stackFields", striped, small)
        template(slot="selected", scope="data")
          b-form-checkbox(:checked="data.item.selected")
    .mb-3
      b-form-checkbox(:checked="!!notebooks", @change="toggleNotebook()") Filter by notebook
      b-table(v-if="notebooks", :items="notebooks", :fields="notebookFields", striped, small)
        template(slot="selected", scope="data")
          b-form-checkbox(:checked="data.item.selected")
</template>

<script lang="ts" src="./filter-modal.component.ts"></script>
