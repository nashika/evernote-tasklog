import { Plugin } from "@nuxt/types";

import { myStore } from "~/src/client/store";

export const myStorePlugin: Plugin = (_context, inject) => {
  inject("myStore", myStore);
};

declare module "vue/types/vue" {
  interface Vue {
    $myStore: typeof myStore;
  }
}

declare module "@nuxt/types" {
  interface NuxtAppOptions {
    $myStore: typeof myStore;
  }
}

/*
declare module "vuex/types/index" {
  interface Store<S> {
    $myStore: typeof myStore;
  }
}
*/
