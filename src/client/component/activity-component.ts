import Component from "vue-class-component";
import _ = require("lodash");

import {BaseComponent} from "./base-component";
import {DataTranscieverService} from "../service/data-transciever-service";
import {kernel} from "../inversify.config";

let template = require("./activity-component.jade");

@Component({
  template: template,
  components: {},
  events: {
    "reload": "reload",
  },
})
export class ActivityComponent extends BaseComponent {

  dataTranscieverService: DataTranscieverService;

  constructor() {
    super();
  }

  data(): any {
    return _.assign(super.data(), {
      dataTranscieverService: kernel.get(DataTranscieverService),
    });
  }

  ready(): Promise<void> {
    return super.ready().then(() => {
      return this.reload();
    });
  }

  reload(): Promise<void> {
    let start = moment().startOf("day");
    let end = moment().endOf("day");
    return this.dataTranscieverService.reload({start: start, end: end, getArchive: true}).then(() => {
    });
  }

}
