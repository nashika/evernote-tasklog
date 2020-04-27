import { Module, Mutation, VuexModule } from "vuex-module-decorators";

export interface ITestState {
  axles: number;
}

@Module({
  name: "datastore",
  stateFactory: true,
  namespaced: true,
})
export default class DatastoreModule extends VuexModule {
  reloading: boolean = false;

  @Mutation
  startReload() {
    this.reloading = true;
  }

  @Mutation
  endReload() {
    this.reloading = false;
  }
}
