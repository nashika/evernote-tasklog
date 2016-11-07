import Component from "vue-class-component";
import _ = require("lodash");

import {BaseComponent} from "../base.component";
import {kernel} from "../../inversify.config";
import {DatastoreService} from "../../service/datastore.service";

let template = require("./activity-mode.component.jade");

@Component({
  template: template,
  components: {},
  events: {
    "reload": "reload",
  },
})
export class ActivityModeComponent extends BaseComponent {

  datastoreService: DatastoreService;

  constructor() {
    super();
  }

  data(): any {
    return _.assign(super.data(), {
      datastoreService: kernel.get(DatastoreService),
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
    return this.datastoreService.reload({start: start, end: end, getArchive: true}).then(() => {
    });
  }

}
