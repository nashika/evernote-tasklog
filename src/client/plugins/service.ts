import { Plugin } from "@nuxt/types";

import { myService } from "~/src/client/service";

export const servicePlugin: Plugin = (_context, inject) => {
  inject("myService", myService);
};

declare module "vue/types/vue" {
  interface Vue {
    $myService: typeof myService;
  }
}

declare module "@nuxt/types" {
  interface NuxtAppOptions {
    $myService: typeof myService;
  }
}

/*
declare module "vuex/types/index" {
  interface Store<S> {
    $myService: typeof myService;
  }
}
*/
