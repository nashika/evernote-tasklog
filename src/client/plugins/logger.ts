import { Plugin } from "@nuxt/types";
import logLevel from "loglevel";

import { logger } from "~/src/common/logger";

const loggerPlugin: Plugin = (_context, inject) => {
  inject("logger", logger);
};

export default loggerPlugin;

declare module "vue/types/vue" {
  interface Vue {
    $logger: logLevel.Logger;
  }
}

declare module "@nuxt/types" {
  interface NuxtAppOptions {
    $logger: logLevel.Logger;
  }
}

/*
declare module "vuex/types/index" {
  interface Store<S> {
    $logger: logLevel.Logger;
  }
}
*/
