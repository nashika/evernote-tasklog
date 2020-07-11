<template lang="pug">
b-modal(id="progress-modal", :visible="$myStore.progress.isActive", title="Loading", ref="modal", size="sm",
  no-fade, no-close-on-backdrop, no-close-on-esc, hide-header, hide-footer)
  b-progress(:value="$myStore.progress.percentage", variant="primary", striped)
  .text-center {{$myStore.progress.percentage}}% ({{$myStore.progress.completeCount}} / {{$myStore.progress.allCount}})
  .text-left {{$myStore.progress.message}}
</template>

<script lang="ts">
import { Component } from "nuxt-property-decorator";

import BaseComponent from "~/src/client/components/base.component";

@Component({})
export default class ProgressModalComponent extends BaseComponent {}
</script>
