import { Store } from "vuex";
import { getModule } from "vuex-module-decorators";

import { DatastoreModule } from "~/src/client/store/datastore";
import { ProgressModule } from "~/src/client/store/progress";

interface IMyStore {
  datastore: DatastoreModule;
  progress: ProgressModule;
}

export const myStore: IMyStore = <any>{};

function initialiseStores(store: Store<any>): void {
  myStore.datastore = getModule(DatastoreModule, store);
  myStore.progress = getModule(ProgressModule, store);
}

const initializer = (store: Store<any>) => initialiseStores(store);
export const plugins = [initializer];
