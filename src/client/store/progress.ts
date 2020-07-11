import { Module, Mutation, VuexModule } from "vuex-module-decorators";
import { myStore } from "~/src/client/store/index";

@Module({
  name: "progress",
  stateFactory: true,
  namespaced: true,
})
export default class ProgressModule extends VuexModule {
  isActive: boolean = false;
  allCount: number = 0;
  completeCount: number = 0;
  message: string = "";
  percentage: number = 0;

  @Mutation
  open(allCount: number): void {
    this.isActive = true;
    this.allCount = allCount;
    this.completeCount = 0;
    myStore.progress.set({
      message: "processing...",
      percentage: 0,
    });
  }

  @Mutation
  close(): void {
    this.isActive = false;
  }

  @Mutation
  set(payload: { message: string; percentage?: number }): void {
    this.message = payload.message;
    if (payload.percentage !== undefined) this.percentage = payload.percentage;
  }

  @Mutation
  next(message: string): void {
    this.completeCount++;
    myStore.progress.set({
      message,
      percentage: Math.floor((this.completeCount / this.allCount) * 100),
    });
  }
}
