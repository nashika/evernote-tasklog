import { Store } from "vuex";
import { getModule } from "vuex-module-decorators";
import Test from "~/src/client/store/test";

// eslint-disable-next-line import/no-mutable-exports
let testStore: Test;

function initialiseStores(store: Store<any>): void {
  testStore = getModule(Test, store);
}

export { initialiseStores, testStore };
