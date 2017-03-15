import Component from "vue-class-component";
import _ = require("lodash");

import {BaseComponent} from "./base.component";
import {ProgressService} from "../service/progress.service";
import {container} from "../inversify.config";

let template = require("./progress-modal.component.jade");

@Component({
  template: template,
  components: {
    //modal: VueStrap.modal,
    //progressbar: VueStrap.progressbar,
  },
})
export class ProgressModalComponent extends BaseComponent {

  progressService: ProgressService;
  show: boolean;
  value: number;
  completeCount: number;
  allCount: number;
  message: string;

  data(): any {
    return _.assign(super.data(), {
      progressService: container.get(ProgressService),
      show: false,
      value: 0,
      completeCount: 0,
      allCount: 0,
      message: "",
    });
  }

  async mounted(): Promise<void> {
    await super.mounted();
    this.progressService.register(this);
  }

}
