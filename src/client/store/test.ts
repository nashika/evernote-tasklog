import { Module, Mutation, VuexModule } from "vuex-module-decorators";

export interface ITestState {
  axles: number;
}

@Module({
  name: "test",
  stateFactory: true,
  namespaced: true,
})
export default class TestModule extends VuexModule {
  wheels = 2;

  @Mutation
  incrWheels(extra: number) {
    this.wheels += extra;
  }

  get axles(): number {
    return this.wheels / 2;
  }
}
