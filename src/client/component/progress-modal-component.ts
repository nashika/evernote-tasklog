import Component from "vue-class-component";
import _ = require("lodash");
var VueStrap = require("vue-strap");

import {ProgressService} from "../service/progress-service";
import {BaseComponent} from "./base-component";
import {serviceRegistry} from "../service/service-registry";

let template = require("./progress-modal-component.jade");

@Component({
  template: template,
  components: {
    modal: VueStrap.modal,
    progressbar: VueStrap.progressbar,
  },
})
export class ProgressModalComponent extends BaseComponent {

  progressService: ProgressService;

  data(): any {
    return _.assign(super.data(), {
      progressService: serviceRegistry.progress,
    });
  }

}
