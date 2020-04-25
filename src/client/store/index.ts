import { Store } from "vuex";
import { initialiseStores } from "~/src/client/utils/store-accessor";
const initializer = (store: Store<any>) => initialiseStores(store);
export const plugins = [initializer];
export * from "~/src/client/utils/store-accessor";
