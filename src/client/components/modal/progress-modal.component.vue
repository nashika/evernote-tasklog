<template lang="pug">
b-modal(id="progress-modal", :visible="$myStore.progress.isActive", title="Loading", ref="modal", size="sm",
  no-fade, no-close-on-backdrop, no-close-on-esc, hide-header, hide-footer)
  b-progress(:value="$myStore.progress.percentage", variant="primary", striped)
  .text-center {{$myStore.progress.percentage}}% ({{$myStore.progress.completeCount}} / {{$myStore.progress.allCount}})
  .text-left {{$myStore.progress.message}}
</template>

<script lang="ts">
import { Component } from "nuxt-property-decorator";

import { BaseComponent } from "~/src/client/components/base.component";

@Component({})
export default class ProgressModalComponent extends BaseComponent {
  async mounted(): Promise<void> {
    // バックグラウンドで2回表示されると消えない問題を無理矢理対応
    setInterval(() => {
      if (!this.$myStore.progress.isActive)
        this.$bvModal.hide("progress-modal");
    }, 1000);
  }
}
</script>
