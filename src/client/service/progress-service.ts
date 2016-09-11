import {BaseService} from "./base-service";
import {ProgressModalComponent} from "../component/progress-modal-component";

export class ProgressService extends BaseService {

  private $component: ProgressModalComponent;
  private value: number = 0;
  private completeCount: number = 0;
  private allCount: number = 0;
  private message: string = "";

  register($component: ProgressModalComponent) {
    this.$component = $component;
  }

  open(allCount: number): void {
    this.allCount = allCount;
    this.completeCount = 0;
    this.set("processing...", 0);
    this.$component.show = true;
  }

  close(): void {
    this.$component.show = false;
  }

  set(message: string, value: number = null): void {
    this.message = message;
    if (value !== null)
      this.value = value;
  }

  next(message: string): void {
    this.completeCount++;
    this.set(message, this.completeCount / this.allCount * 100);
  }

}
