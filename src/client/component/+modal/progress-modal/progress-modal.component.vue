<template lang="pug">
  b-modal(id="progress", :visible="progressService.isActive", title="Loading", ref="modal", size="sm",
  no-fade, no-close-on-backdrop, no-close-on-esc, hide-header, hide-footer)
    b-progress(:value="progressService.percentage", variant="primary", striped)
    .text-center {{progressService.percentage}}% ({{progressService.completeCount}} / {{progressService.allCount}})
    .text-left {{progressService.message}}
</template>

<script lang="ts" src="./progress-modal.component.ts"></script>
