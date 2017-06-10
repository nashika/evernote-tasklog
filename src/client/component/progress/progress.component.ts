import Component from "vue-class-component";

import BaseComponent from "../base.component";
import {ProgressService} from "../../service/progress.service";
import {container} from "../../inversify.config";

@Component({})
export default class ProgressModalComponent extends BaseComponent {

  progressService: ProgressService = container.get(ProgressService);
  value: number = 0;
  completeCount: number = 0;
  allCount: number = 0;
  message: string = "";

  async mounted(): Promise<void> {
    await super.mounted();
    this.progressService.register(this);
  }

}
