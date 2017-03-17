import {injectable} from "inversify";

import{BaseClientService} from "./base-client.service";
import {ProgressModalComponent} from "../component/progress-modal.component";

@injectable()
export class ProgressService extends BaseClientService {

  private $component: ProgressModalComponent;

  register($component: ProgressModalComponent) {
    this.$component = $component;
  }

  open(allCount: number): void {
    this.$component.allCount = allCount;
    this.$component.completeCount = 0;
    this.set("processing...", 0);
    (<any>this.$component.$refs.modal).show();
  }

  close(): void {
    (<any>this.$component.$refs.modal).hide();
  }

  set(message: string, value: number = null): void {
    this.$component.message = message;
    if (value !== null)
      this.$component.value = value;
  }

  next(message: string): void {
    this.$component.completeCount++;
    this.set(message, Math.floor(this.$component.completeCount / this.$component.allCount * 100));
  }

}
