import Component from "vue-class-component";
import _ = require("lodash");
import moment = require("moment");
import Vue = require("vue");
import diff = require("diff");
import htmlToText = require("html-to-text");
import diff2html = require("diff2html");
let vueStrap = require("vue-strap");

import {BaseComponent} from "../base.component";
import {kernel} from "../../inversify.config";
import {DatastoreService} from "../../service/datastore.service";
import {AppComponent} from "../app.component";
import {NoteEntity} from "../../../common/entity/note.entity";
import {MyPromise} from "../../../common/util/my-promise";

let template = require("./activity-mode.component.jade");

interface IActivityModifyData {
  prevNote?: NoteEntity;
  diffPatch?: string;
  diffHtml?: string;
}

@Component({
  template: template,
  components: {
    popover: vueStrap.popover,
  },
  events: {
    "reload": "reload",
  },
})
export class ActivityModeComponent extends BaseComponent {

  $root: AppComponent;

  datastoreService: DatastoreService;

  date: Date;
  modifies: {[_id: string]: IActivityModifyData};

  constructor() {
    super();
  }

  data(): any {
    return _.assign(super.data(), {
      datastoreService: kernel.get(DatastoreService),
      date: new Date(),
      modifies: {},
    });
  }

  ready(): Promise<void> {
    return super.ready().then(() => {
      return this.reload();
    });
  }

  reload(): Promise<void> {
    let start = moment(this.date).startOf("day");
    let end = moment(this.date).endOf("day");
    return this.datastoreService.reload({start: start, end: end, archive: true}).then(() => {
      return MyPromise.eachPromiseSeries(this.datastoreService.noteArchives, (note: NoteEntity) => {
        let modify: IActivityModifyData = {};
        modify.prevNote = _.find(this.datastoreService.noteArchives, (searchNote: NoteEntity) => {
          return searchNote.guid == note.guid && searchNote.updateSequenceNum < note.updateSequenceNum;
        });
        if (modify.prevNote) {
          let oldText = htmlToText.fromString(modify.prevNote.content);
          let newText = htmlToText.fromString(note.content);
          modify.diffPatch = diff.createPatch("Note Content", oldText, newText, "", "");
          modify.diffHtml = diff2html.Diff2Html.getPrettyHtml(modify.diffPatch);
        }
        Vue.set(this.modifies, note._id, modify);
        return Promise.resolve();
      });
    });
  }

  changeDate(direction: boolean) {
    this.date = moment(this.date).add(direction ? 1 : -1, "days").toDate();
    this.reload();
  }

  detail(note: NoteEntity) {
    return `UpdateSequenceNum: ${note.updateSequenceNum}`;
  }

}
