import { Store } from "vuex";
import { getModule } from "vuex-module-decorators";

import test from "~/src/client/store/test";

// eslint-disable-next-line import/no-mutable-exports
export let myStore: {
  test: test;
};

function initialiseStores(store: Store<any>): void {
  myStore = {
    test: getModule(test, store),
  };
}

const initializer = (store: Store<any>) => initialiseStores(store);
export const plugins = [initializer];
