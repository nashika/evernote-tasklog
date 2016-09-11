import Component from "vue-class-component";
import _ = require("lodash");
var VueStrap = require("vue-strap");

import {BaseComponent} from "./base-component";
import {DataStoreService} from "../service/data-store-service";
import {serviceRegistry} from "../service/service-registry";

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
  ready: SettingsComponent.prototype.onReload,
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

/*    for (var fieldName in (<typeof SettingsController>this.constructor).FIELDS)
      this.$scope.$watch(`dataStore.settings.${fieldName}`, this._onWatchSetting(fieldName));
    this.$scope.$on('event::reload', this._onReload);*/
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

  /*protected _submit = (): void => {
    this.progress.open(1);
    var count = 0;
    var reParse = false;
    var reload = false;
    async.forEachOfSeries((<typeof SettingsController>this.constructor).FIELDS, (field, key, callback) => {
      if (JSON.stringify(angular.copy(this.$scope.editStore[key])) == JSON.stringify(this.dataStore.settings[key]))
        return callback();
      if (field.reParse) reParse = true;
      if (field.reload) reload = true;
      this.progress.set(`Saving ${key}...`, count++ / Object.keys((<typeof SettingsController>this.constructor).FIELDS).length * 100);
      this.$http.put('/settings/save', {key: key, value: this.$scope.editStore[key]})
        .success(() => {
          this.dataStore.settings[key] = this.$scope.editStore[key];
          callback();
        })
        .error(() => {
          callback(new Error(`Error saving ${key}`));
        });
    }, (err) => {
      if (err) alert(err);
      this.progress.close();
      async.waterfall([
        (callback: (err?: Error) => void) => {
          if (reParse)
            this.dataTransciever.reParse(callback);
          else
            callback();
        },
        (callback: (err?: Error) => void) => {
          if (reload)
            this.dataTransciever.reload({getContent: false}, callback);
          else
            callback();
        }]);
    });
  };

  protected _onWatchSetting = (key: string): any => {
    return () => {
      this.$scope.editStore[key] = angular.copy(this.dataStore.settings[key]);
    }
  };*/

  onReload() {
    serviceRegistry.dataTransciever.reload({getContent: false});
  }

}
