<template lang="pug">
  b-modal(id="progress", title="Loading", ref="modal", size="sm", :fade="false", :close-on-backdrop="false", :hide-header="true", :hide-footer="true")
    //.progress
      progressbar(:now="value", type="primary", striped)
    .text-center {{value}}% ({{completeCount}} / {{allCount}})
    .text-left {{message}}
</template>

<script lang="ts" src="./progress.component.ts"></script>
