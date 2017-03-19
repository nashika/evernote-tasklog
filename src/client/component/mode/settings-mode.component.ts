import Component from "vue-class-component";
import _ = require("lodash");
import Vue = require("vue");

import {BaseComponent} from "../base.component";
import {DatastoreService} from "../../service/datastore.service";
import {ProgressService} from "../../service/progress.service";
import {RequestService} from "../../service/request.service";
import {container} from "../../inversify.config";

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

@Component<SettingsModeComponent>({
  template: template,
})
export class SettingsModeComponent extends BaseComponent {

  datastoreService: DatastoreService = container.get(DatastoreService);
  requestService: RequestService = container.get(RequestService);
  progressService: ProgressService = container.get(ProgressService);
  editStore: {[key: string]: any} = null;
  fields: {[field: string]: {[key: string]: any}} = fields;

  async mounted(): Promise<void> {
    await super.mounted();
    await this.reload();
    this.editStore = _.cloneDeep(this.datastoreService.settings);
    if (!this.editStore["persons"]) Vue.set(this.editStore, "persons", []);
  }

  async reload(): Promise<void> {
    await this.datastoreService.reload({getContent: false});
  }

  up(index: number): void {
    if (index == 0) return;
    this.editStore["persons"].splice(index - 1, 2, this.editStore["persons"][index], this.editStore["persons"][index - 1]);
  }

  down(index: number): void {
    if (index >= this.editStore["persons"].length - 1) return;
    this.editStore["persons"].splice(index, 2, this.editStore["persons"][index + 1], this.editStore["persons"][index]);
  }

  remove(index: number): void {
    this.editStore["persons"].splice(index, 1);
  }

  add(): void {
    this.editStore["persons"].push({name: `Person ${this.editStore["persons"].length + 1}`});
  }

  async submit(): Promise<void> {
    this.progressService.open(_.size(this.fields));
    let reParse = false;
    let reload = false;
    try {
      for (let key in this.fields) {
        let field = this.fields[key];
        this.progressService.next(`Saving ${key}...`);
        if (JSON.stringify(this.editStore[key]) == JSON.stringify(this.datastoreService.settings[key]))
          continue;
        if (field.reParse) reParse = true;
        if (field.reload) reload = true;
        await this.requestService.saveOption(`settings.${key}`, this.editStore[key]);
        this.datastoreService.settings[key] = this.editStore[key];
      }
      this.progressService.close();
      if (reParse)
        await this.datastoreService.reParse();
      if (reload)
        await this.datastoreService.reload({getContent: false});
    } catch (err) {
      alert(err);
    }
  }

}
