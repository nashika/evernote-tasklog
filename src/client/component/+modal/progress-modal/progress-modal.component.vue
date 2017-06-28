<template lang="pug">
  b-modal(id="progress", :visible="progressService.isActive", title="Loading", ref="modal", size="sm", :fade="false", :close-on-backdrop="false", :hide-header="true", :hide-footer="true")
    b-progress(:value="progressService.percentage", variant="primary")
    .text-center {{progressService.percentage}}% ({{progressService.completeCount}} / {{progressService.allCount}})
    .text-left {{progressService.message}}
</template>

<script lang="ts" src="./progress-modal.component.ts"></script>
