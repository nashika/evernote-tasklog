import Component from "vue-class-component";
import _ = require("lodash");
import moment = require("moment");
import Vue = require("vue");
import diff = require("diff");
import htmlToText = require("html-to-text");
import diff2html = require("diff2html");

import {BaseComponent} from "../base.component";
import {container} from "../../inversify.config";
import {DatastoreService} from "../../service/datastore.service";
import {AppComponent} from "../app.component";
import {NoteEntity} from "../../../common/entity/note.entity";

let template = require("./activity-mode.component.jade");

interface IActivityModifyData {
  prevNote?: NoteEntity;
  diffPatch?: string;
  diffHtml?: string;
}

@Component<ActivityModeComponent>({
  template: template,
  components: {
    //popover: vueStrap.popover,
  },
  /*events: {
    "reload": "reload",
  },*/
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
      datastoreService: container.get(DatastoreService),
      date: new Date(),
      modifies: {},
    });
  }

  async created() {

  }

  async mounted(): Promise<void> {
    await super.mounted();
    await this.reload();
  }

  async reload(): Promise<void> {
    let start = moment(this.date).startOf("day");
    let end = moment(this.date).endOf("day");
    this.modifies = {};
    await this.datastoreService.reload({start: start, end: end, archive: true, archiveMinStepMinute: 10});
    for (let note of this.datastoreService.noteArchives) {
      let prevNote = await this.datastoreService.getPrevNote(note, 10);
      let modify: IActivityModifyData = {};
      modify.prevNote = prevNote;
      let oldText = this.makeDiffText(modify.prevNote);
      let newText = this.makeDiffText(note);
      modify.diffPatch = diff.createPatch("Note Content", oldText, newText, "", "", {context: 0});
      modify.diffHtml = diff2html.Diff2Html.getPrettyHtml(modify.diffPatch);
      Vue.set(this.modifies, note._id, modify);
    }
  }

  private makeDiffText(note: NoteEntity): string {
    if (!note) return "";
    let noteContent = note.content
      .replace(/<en-todo checked="false"\/>/g, "□")
      .replace(/<en-todo checked="true"\/>/g, "■")
      .replace(/<br\/>/g, "")
      .replace(/<\/div>/g, "<br/></div>");
    let plainContentText = htmlToText.fromString(noteContent);
    return `###Note Header###
Title: ${note.title}
Notebook: [${this.notebookName(note)}]
Tags: ${_.join(_.map(this.tagNames(note), tagName => `[${tagName}]`), " ")}

###Note Content###
${plainContentText}
`;
  }

  changeDate(direction: boolean) {
    this.date = moment(this.date).add(direction ? 1 : -1, "days").toDate();
    this.reload();
  }

  detail(note: NoteEntity): string {
    return `Updated: ${moment(note.updated).format("YYYY/MM/DD HH:mm:ss")}<br />
Created: ${moment(note.created).format("YYYY/MM/DD HH:mm:ss")}<br />
UpdateSequenceNum: ${note.updateSequenceNum}`;
  }

  notebookName(note: NoteEntity): string {
    return this.datastoreService.notebooks[note.notebookGuid].name;
  }

  tagNames(note: NoteEntity): string[] {
    return _.map(note.tagGuids, tagGuid => this.datastoreService.tags[tagGuid].name);
  }

}
