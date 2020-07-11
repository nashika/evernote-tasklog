import { Store } from "vuex";
import { getModule } from "vuex-module-decorators";

import TestModule from "~/src/client/store/test";
import DatastoreModule from "~/src/client/store/datastore";
import ProgressModule from "~/src/client/store/progress";

interface IMyStore {
  test: TestModule;
  datastore: DatastoreModule;
  progress: ProgressModule;
}

// eslint-disable-next-line import/no-mutable-exports
export let myStore: IMyStore;

function initialiseStores(store: Store<any>): void {
  myStore = {
    test: getModule(TestModule, store),
    datastore: getModule(DatastoreModule, store),
    progress: getModule(ProgressModule, store),
  };
}

const initializer = (store: Store<any>) => initialiseStores(store);
export const plugins = [initializer];
