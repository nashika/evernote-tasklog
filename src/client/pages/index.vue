<script lang="ts">
import { Component } from "nuxt-property-decorator";
import { NuxtContext } from "~/src/types/nuxt";

import { BaseComponent } from "~/src/client/components/base.component";

@Component
export default class extends BaseComponent {
  async fetch(context: NuxtContext): Promise<void> {
    context.redirect(301, "/attendance");
    return Promise.resolve();
  }
}
</script>
