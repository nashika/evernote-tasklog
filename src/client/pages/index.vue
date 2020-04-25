<script lang="ts">
import { Component } from "nuxt-property-decorator";
import Logo from "~/src/client/components/Logo.vue";
import BaseComponent from "~/src/client/components/base.component";
import { NuxtContext } from "~/src/types/nuxt";

@Component({
  components: {
    Logo,
  },
})
export default class extends BaseComponent {
  async fetch(context: NuxtContext): Promise<void> {
    context.redirect(301, "/attendance");
    return Promise.resolve();
  }
}
</script>
