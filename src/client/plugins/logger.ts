import { Plugin } from "@nuxt/types";
import logLevel from "loglevel";

import { appConfigLoader } from "~/src/common/util/app-config-loader";

export const logger = logLevel.getLogger("evernote-tasklog");

logger.setLevel(appConfigLoader.app.logLevel);

export const loggerPlugin: Plugin = (_context, inject) => {
  inject("logger", logger);
};

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
