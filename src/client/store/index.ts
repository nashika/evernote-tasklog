import { Store } from "vuex";
import { getModule } from "vuex-module-decorators";

import TestModule from "~/src/client/store/test";
import DatastoreModule from "~/src/client/store/datastore";

// eslint-disable-next-line import/no-mutable-exports
export let myStore: {
  test: TestModule;
  datastore: DatastoreModule;
};

function initialiseStores(store: Store<any>): void {
  myStore = {
    test: getModule(TestModule, store),
    datastore: getModule(DatastoreModule, store),
  };
}

const initializer = (store: Store<any>) => initialiseStores(store);
export const plugins = [initializer];
