import Component from "vue-class-component";
import _ = require("lodash");

import {BaseComponent} from "./base-component";
import {serviceRegistry} from "../service/service-registry";
import {DataTranscieverService} from "../service/data-transciever-service";
import {DataStoreService} from "../service/data-store-service";

let template = require("./menu-component.jade");

@Component({
  template: template,
  components: {},
  ready: MenuComponent.prototype.onReady,
  //this.$scope.$watchGroup(['dataTransciever.filterParams.notebookGuids', 'dataTransciever.filterParams.stacks'], this._onWatchFilterParams);
  //this.$scope.$on('event::reload', this._onReload);
})
export class MenuComponent extends BaseComponent {

  dataStoreService: DataStoreService;
  dataTranscieverService: DataTranscieverService;
  noteCount: number;
  allNoteCount: number;
  loadedNoteCount: number;
  allLoadedNoteCount: number;
  timeLogCount: number;
  allTimeLogCount: number;
  profitLogCount: number;
  allProfitLogCount: number;

  data(): any {
    return _.assign(super.data(), {
      dataStoreService: serviceRegistry.dataStore,
      dataTranscieverService: serviceRegistry.dataTransciever,
      noteCount: 0,
      allNoteCount: 0,
      loadedNoteCount: 0,
      allLoadedNoteCount: 0,
      timeLogCount: 0,
      allTimeLogCount: 0,
      profitLogCount: 0,
      allProfitLogCount: 0,
    });
  }

  onReady() {
    this.reload();
  }

  reload() {
    this.dataTranscieverService.reload({getContent: false});
  };
/*
  protected _onWatchFilterParams = (): void => {
    async.waterfall([
      (callback: (err?: Error) => void) => {
        this.dataTransciever.countNotes({}, (err: Error, count: number) => {
          if (!err) this.$scope.noteCount = count;
          callback(err);
        });
      },
      (callback: (err?: Error) => void) => {
        this.dataTransciever.countNotes({noFilter: true}, (err: Error, count: number) => {
          if (!err) this.$scope.allNoteCount = count;
          callback(err);
        });
      },
      (callback: (err?: Error) => void) => {
        this.dataTransciever.countNotes({hasContent: true}, (err: Error, count: number) => {
          if (!err) this.$scope.loadedNoteCount = count;
          callback(err);
        });
      },
      (callback: (err?: Error) => void) => {
        this.dataTransciever.countNotes({hasContent: true, noFilter: true}, (err: Error, count: number) => {
          if (!err) this.$scope.allLoadedNoteCount = count;
          callback(err);
        });
      },
      (callback: (err?: Error) => void) => {
        this.dataTransciever.countTimeLogs({}, (err: Error, count: number) => {
          if (!err) this.$scope.timeLogCount = count;
          callback(err);
        });
      },
      (callback: (err?: Error) => void) => {
        this.dataTransciever.countTimeLogs({noFilter: true}, (err: Error, count: number) => {
          if (!err) this.$scope.allTimeLogCount = count;
          callback(err);
        });
      },
    ], (err?: Error): void => {
      if (err) alert(err);
    });
  }*/

}
