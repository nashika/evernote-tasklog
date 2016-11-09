import Component from "vue-class-component";
import _ = require("lodash");
import moment = require("moment");
let vis = require("vis");

import {BaseComponent} from "../base.component";
import {DatastoreService} from "../../service/datastore.service";
import {NoteEntity} from "../../../common/entity/note.entity";
import {abbreviateFilter} from "../../filter/abbreviate.filter";
import {TimeLogEntity} from "../../../common/entity/time-log.entity";
import {kernel} from "../../inversify.config";

let template = require("./timeline-mode.component.jade");

interface TimelineItem {
  id: string,
  group: string,
  content: string,
  start: Date,
  end?: Date,
  type: string,
}

@Component({
  template: template,
  components: {},
  events: {
    "reload": "reload",
    //this.$on("resize", this.onResize);
  },
})
export class TimelineModeComponent extends BaseComponent {

  datastoreService: DatastoreService;
  timeline: any;
  timelineItems: any;
  timelineGroups: any;
  start: moment.Moment;
  end: moment.Moment;

  constructor() {
    super();
  }

  data(): any {
    return _.assign(super.data(), {
      datastoreService: kernel.get(DatastoreService),
      timeline: null,
      timelineItems: null,
      timelineGroups: null,
      start: moment().startOf("day"),
      end: moment().endOf("day"),
    });
  }

  ready(): Promise<void> {
    return super.ready().then(() => {
      // generate timeline object
      this.timelineItems = new vis.DataSet();
      this.timelineGroups = new vis.DataSet();
      // reload
      return this.reload();
    }).then(() => {
      let container: HTMLElement = <HTMLElement>this.$el.querySelector("#timeline");
      // set working time
      let hiddenDates: {start: moment.Moment, end: moment.Moment, repeat: string}[];
      if (this.datastoreService.settings && this.datastoreService.settings["startWorkingTime"] && this.datastoreService.settings["endWorkingTime"])
        hiddenDates = [{
          start: moment().subtract(1, "days").startOf("day").hour(this.datastoreService.settings["endWorkingTime"]),
          end: moment().startOf("day").hour(this.datastoreService.settings["startWorkingTime"]),
          repeat: "daily",
        }];
      else
        hiddenDates = [];
      this.timeline = new vis.Timeline(container, this.timelineItems, this.timelineGroups, {
        margin: {item: 5},
        height: window.innerHeight - 80,
        orientation: {axis: "both", item: "top"},
        start: this.start,
        end: this.end,
        order: (a: TimelineItem, b: TimelineItem) => {
          return a.start.getTime() - b.start.getTime();
        },
        hiddenDates: hiddenDates,
      });
      // add events
      this.timeline.on("rangechanged", (properties: {start: Date, end: Date}) => this.onRangeChanged(properties));
    })
  }

  reload(): Promise<void> {
    return this.datastoreService.reload({start: this.start, end: this.end, getContent: true}).then(() => {
      this.timelineGroups.clear();
      this.timelineItems.clear();
      if (!this.datastoreService.settings || !this.datastoreService.settings["persons"]) return null;
      for (let person of this.datastoreService.settings["persons"])
        this.timelineGroups.add({
          id: person.name,
          content: person.name,
        });
      this.timelineGroups.add({
        id: "updated",
        content: "Update",
      });
      let notes: {[noteGuid: string]: NoteEntity} = {};
      for (var noteGuid in this.datastoreService.notes) {
        let note: NoteEntity = this.datastoreService.notes[noteGuid];
        notes[note.guid] = note;
        let timelineItem: TimelineItem = {
          id: note.guid,
          group: "updated",
          content: `<a href="evernote:///view/${this.datastoreService.user.id}/${this.datastoreService.user.shardId}/${note.guid}/${note.guid}/" title="${note.title}">${abbreviateFilter(note.title, 40)}</a>`,
          start: moment(note.updated).toDate(),
          type: "point",
        };
        this.timelineItems.add(timelineItem);
      }
      for (let noteGuid in this.datastoreService.timeLogs) {
        let noteTimeLogs = this.datastoreService.timeLogs[noteGuid];
        for (var timeLogId in noteTimeLogs) {
          let timeLog: TimeLogEntity = noteTimeLogs[timeLogId];
          let noteTitle: string = notes[timeLog.noteGuid].title;
          let timelineItem: TimelineItem = {
            id: timeLog._id,
            group: timeLog.person,
            content: `<a href="evernote:///view/${this.datastoreService.user["id"]}/${this.datastoreService.user["shardId"]}/${timeLog.noteGuid}/${timeLog.noteGuid}/" title="${noteTitle} ${timeLog.comment}">${abbreviateFilter(noteTitle, 20)} ${abbreviateFilter(timeLog.comment, 20)}</a>`,
            start: moment(timeLog.date).toDate(),
            end: timeLog.spentTime ? moment(timeLog.date).add(timeLog.spentTime, 'minutes').toDate() : null,
            type: timeLog.spentTime ? 'range' : 'point',
          };
          this.timelineItems.add(timelineItem);
        }
      }
      return Promise.resolve();
    });
  }

  onRangeChanged(properties: {start: Date, end: Date}) {
    let currentStart = moment(properties.start).startOf("day");
    let currentEnd = moment(properties.end).endOf("day");
    if (currentStart.isSameOrAfter(this.start) && currentEnd.isSameOrBefore(this.end))
      return;
    if (!this.start || currentStart.isBefore(this.start)) this.start = currentStart;
    if (!this.end || currentEnd.isAfter(this.end)) this.end = currentEnd;
    this.reload();
  };

  onResize() {
    this.timeline.setOptions({
      height: window.innerHeight - 90,
    });
  };

}
