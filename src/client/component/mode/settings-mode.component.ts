import Component from "vue-class-component";
import _ = require("lodash");
import Vue = require("vue");
var VueStrap = require("vue-strap");

import {BaseComponent} from "../base.component";
import {DatastoreService} from "../../service/datastore.service";
import {MyPromise} from "../../../common/util/my-promise";
import {SettingEntity} from "../../../common/entity/setting.entity";
import {ProgressService} from "../../service/progress.service";
import {RequestService} from "../../service/request.service";
import {kernel} from "../../inversify.config";

let template = require("./settings-mode.component.jade");

let fields: {[fieldName: string]: {[key: string]: any}} = {
  persons: {
    reParse: true,
    reload: true,
  },
  startWorkingTime: {
    heading: 'Start Working Time',
    type: 'number',
  },
  endWorkingTime: {
    heading: 'End Working Time',
    type: 'number',
  },
};

@Component({
  template: template,
  components: {
    tabs: VueStrap.tabset,
    tabGroup: VueStrap.tabGroup,
    tab: VueStrap.tab,
  },
  events: {
    "reload": "reload",
  },
})
export class SettingsModeComponent extends BaseComponent {

  datastoreService: DatastoreService;
  requestService: RequestService;
  progressService: ProgressService;
  editStore: {[key: string]: any};
  fields: {[field: string]: {[key: string]: any}};

  data(): any {
    return _.assign(super.data(), {
      datastoreService: kernel.get(DatastoreService),
      requestService: kernel.get(RequestService),
      progressService: kernel.get(ProgressService),
      editStore: {
        persons: [],
      },
      fields: fields,
    });
  }

  ready(): Promise<void> {
    return super.ready().then(() => {
      return this.reload(true);
    }).then(() => {
      this.editStore = _.cloneDeep(this.datastoreService.settings);
      if (!this.editStore["persons"]) Vue.set(this.editStore, "persons", []);
    });
  }

  reload(manual: boolean): Promise<boolean> {
    return this.datastoreService.reload({getContent: false, manual: manual});
  }

  up(index: number) {
    if (index == 0) return;
    this.editStore["persons"].splice(index - 1, 2, this.editStore["persons"][index], this.editStore["persons"][index - 1]);
  }

  down(index: number) {
    if (index >= this.editStore["persons"].length - 1) return;
    this.editStore["persons"].splice(index, 2, this.editStore["persons"][index + 1], this.editStore["persons"][index]);
  }

  remove(index: number) {
    this.editStore["persons"].splice(index, 1);
  }

  add() {
    this.editStore["persons"].push({name: `Person ${this.editStore["persons"].length + 1}`});
  }

  submit() {
    this.progressService.open(_.size(this.fields));
    let reParse = false;
    let reload = false;
    MyPromise.eachPromiseSeries(this.fields, (field: any, key: string) => {
      this.progressService.next(`Saving ${key}...`);
      if (JSON.stringify(this.editStore[key]) == JSON.stringify(this.datastoreService.settings[key]))
        return null;
      if (field.reParse) reParse = true;
      if (field.reload) reload = true;
      return this.requestService.save<SettingEntity>(SettingEntity, new SettingEntity({
        _id: key,
        value: this.editStore[key]
      })).then(() => {
        this.datastoreService.settings[key] = this.editStore[key];
      });
    }).then(() => {
      this.progressService.close();
      if (reParse)
        return this.datastoreService.reParse();
      return null;
    }).then(() => {
      if (reload)
        return this.datastoreService.reload({getContent: false});
      return null;
    }).catch(err => alert(err));
  }

}
