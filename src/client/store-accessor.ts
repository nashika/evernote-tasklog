import { Store } from "vuex";
import { getModule } from "vuex-module-decorators";
import test from "~/src/client/store/test";

// eslint-disable-next-line import/no-mutable-exports
let testStore: test;

function initialiseStores(store: Store<any>): void {
  testStore = getModule(test, store);
}

export { initialiseStores, testStore };
