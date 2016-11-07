import Component from "vue-class-component";
import _ = require("lodash");
import moment = require("moment");
import Vue = require("vue");

import {BaseComponent} from "../base.component";
import {kernel} from "../../inversify.config";
import {DatastoreService} from "../../service/datastore.service";
import {AppComponent} from "../app.component";
import {NoteEntity} from "../../../common/entity/note.entity";
import {MyPromise} from "../../../common/util/my-promise";

let template = require("./activity-mode.component.jade");

interface IActivityModifyData {
  text?: string;
  prevNote?: NoteEntity;
}

@Component({
  template: template,
  components: {},
  events: {
    "reload": "reload",
  },
})
export class ActivityModeComponent extends BaseComponent {

  $root: AppComponent;

  datastoreService: DatastoreService;

  modifies: {[_id: string]: IActivityModifyData};

  constructor() {
    super();
  }

  data(): any {
    return _.assign(super.data(), {
      datastoreService: kernel.get(DatastoreService),
      modifies: {},
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
    return this.datastoreService.reload({start: start, end: end, archive: true}).then(() => {
      return MyPromise.eachPromiseSeries(this.datastoreService.noteArchives, (note: NoteEntity) => {
        let modify: IActivityModifyData = {};
        modify.prevNote = _.find(this.datastoreService.noteArchives, (searchNote: NoteEntity) => {
          return searchNote.guid == note.guid && searchNote.updateSequenceNum < note.updateSequenceNum;
        });
        modify.text = modify.prevNote ? _.toString(modify.prevNote.updateSequenceNum) : "None";
        Vue.set(this.modifies, note._id, modify);
        return Promise.resolve();
      });
    });
  }

}
