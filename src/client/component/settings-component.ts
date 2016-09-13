import Component from "vue-class-component";
import _ = require("lodash");
import Vue = require("vue");
var VueStrap = require("vue-strap");

import {BaseComponent} from "./base-component";
import {DataStoreService} from "../service/data-store-service";
import {serviceRegistry} from "../service/service-registry";
import {MyPromise} from "../../common/util/my-promise";
import {SettingEntity} from "../../common/entity/setting-entity";

let template = require("./settings-component.jade");

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
export class SettingsComponent extends BaseComponent {

  dataStoreService: DataStoreService;
  editStore: {[key: string]: any};
  fields: {[field: string]: {[key: string]: any}};

  data(): any {
    return _.assign(super.data(), {
      dataStoreService: serviceRegistry.dataStore,
      editStore: {
        persons: [],
      },
      fields: fields,
    });
  }

  ready() {
    this.reload().then(() => {
      this.editStore = _.cloneDeep(serviceRegistry.dataStore.settings);
      if (!this.editStore["persons"]) Vue.set(this.editStore, "persons", []);
    });
  }

  reload(): Promise<void> {
    return serviceRegistry.dataTransciever.reload({getContent: false});
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
    serviceRegistry.progress.open(_.size(this.fields));
    let count = 0;
    let reParse = false;
    let reload = false;
    MyPromise.eachPromiseSeries(this.fields, (field: any, key: string) => {
      if (JSON.stringify(this.editStore[key]) == JSON.stringify(serviceRegistry.dataStore.settings[key]))
        return;
      if (field.reParse) reParse = true;
      if (field.reload) reload = true;
      serviceRegistry.progress.next(`Saving ${key}...`);
      return serviceRegistry.request.save<SettingEntity>(SettingEntity, new SettingEntity({_id: key, value: this.editStore[key]})).then(() => {
        serviceRegistry.dataStore.settings[key] = this.editStore[key];
      });
    }).then(() => {
      serviceRegistry.progress.close();
      if (reParse)
        return serviceRegistry.dataTransciever.reParse();
    }).then(() => {
      if (reload)
        return serviceRegistry.dataTransciever.reload({getContent: false});
    }).catch(err => alert(err));
  }

}
