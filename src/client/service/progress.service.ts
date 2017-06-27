import {injectable} from "inversify";

import{BaseClientService} from "./base-client.service";

@injectable()
export class ProgressService extends BaseClientService {

  isActive: boolean = false;
  allCount: number = 0;
  completeCount: number = 0;
  message: string = "";
  percentage: number = 0;

  open(allCount: number): void {
    this.isActive = true;
    this.allCount = allCount;
    this.completeCount = 0;
    this.set("processing...", 0);
  }

  close(): void {
    this.isActive = false;
  }

  set(message: string, percentage: number = null): void {
    this.message = message;
    if (percentage !== null)
      this.percentage = percentage;
  }

  next(message: string): void {
    this.completeCount++;
    this.set(message, Math.floor(this.completeCount / this.allCount * 100));
  }

}
