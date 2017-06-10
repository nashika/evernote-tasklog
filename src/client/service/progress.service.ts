import {injectable} from "inversify";

import{BaseClientService} from "./base-client.service";
import ProgressModalComponent from "../component/progress/progress.component";

@injectable()
export class ProgressService extends BaseClientService {

  isActive: boolean = false;

  private $component: ProgressModalComponent;

  register($component: ProgressModalComponent) {
    this.$component = $component;
  }

  open(allCount: number): void {
    this.isActive = true;
    this.$component.allCount = allCount;
    this.$component.completeCount = 0;
    this.set("processing...", 0);
    (<any>this.$component.$refs.modal).show();
  }

  close(): void {
    (<any>this.$component.$refs.modal).hide();
    this.isActive = false;
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
