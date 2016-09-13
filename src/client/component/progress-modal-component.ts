import Component from "vue-class-component";
import _ = require("lodash");
var VueStrap = require("vue-strap");

import {BaseComponent} from "./base-component";
import {clientServiceRegistry} from "../service/client-service-registry";

let template = require("./progress-modal-component.jade");

@Component({
  template: template,
  components: {
    modal: VueStrap.modal,
    progressbar: VueStrap.progressbar,
  },
})
export class ProgressModalComponent extends BaseComponent {

  show: boolean;
  value: number;
  completeCount: number;
  allCount: number;
  message: string;

  data(): any {
    return _.assign(super.data(), {
      show: false,
      value: 0,
      completeCount: 0,
      allCount: 0,
      message: "",
    });
  }

  ready() {
    clientServiceRegistry.progress.register(this);
  }

}
