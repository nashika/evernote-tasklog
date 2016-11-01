import Component from "vue-class-component";
import _ = require("lodash");
import moment = require("moment");
let vis = require("vis");

import {BaseComponent} from "./base-component";
import {DataStoreService} from "../service/data-store-service";
import {NoteEntity} from "../../common/entity/note-entity";
import {abbreviateFilter} from "../filter/abbreviate";
import {TimeLogEntity} from "../../common/entity/time-log-entity";
import {DataTranscieverService} from "../service/data-transciever-service";
import {kernel} from "../inversify.config";

let template = require("./timeline-component.jade");

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
export class TimelineComponent extends BaseComponent {

  dataStoreService: DataStoreService;
  dataTranscieverService: DataTranscieverService;
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
      dataStoreService: kernel.get(DataStoreService),
      dataTranscieverService: kernel.get(DataTranscieverService),
      timeline: null,
      timelineItems: null,
      timelineGroups: null,
      start: moment().startOf("day"),
      end: moment().endOf("day"),
    });
  }

  ready(): Promise<void> {
    return super.ready().then(() => {
      let container: HTMLElement = <HTMLElement>this.$el.querySelector("#timeline");
      // set working time
      let hiddenDates: {start: moment.Moment, end: moment.Moment, repeat: string}[];
      if (this.dataStoreService.settings && this.dataStoreService.settings["startWorkingTime"] && this.dataStoreService.settings["endWorkingTime"])
        hiddenDates = [{
          start: moment().subtract(1, "days").startOf("day").hour(this.dataStoreService.settings["endWorkingTime"]),
          end: moment().startOf("day").hour(this.dataStoreService.settings["startWorkingTime"]),
          repeat: "daily",
        }];
      else
        hiddenDates = [];
      // generate timeline object
      this.timelineItems = new vis.DataSet();
      this.timelineGroups = new vis.DataSet();
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
      // set person data
      if (!this.dataStoreService.settings || !this.dataStoreService.settings["persons"]) return;
      for (let person of this.dataStoreService.settings["persons"])
        this.timelineGroups.add({
          id: person.name,
          content: person.name,
        });
      this.timelineGroups.add({
        id: "updated",
        content: "Update",
      });
      // add events
      this.timeline.on("rangechanged", (properties: {start: Date, end: Date}) => this.onRangeChanged(properties));
      // reload
      return this.reload();
    });
  }

  reload(): Promise<void> {
    return this.dataTranscieverService.reload({start: this.start, end: this.end, getContent: true}).then(() => {
      this.timelineItems.clear();
      let notes: {[noteGuid: string]: NoteEntity} = {};
      for (var noteGuid in this.dataStoreService.notes) {
        let note: NoteEntity = this.dataStoreService.notes[noteGuid];
        notes[note.guid] = note;
        let timelineItem: TimelineItem = {
          id: note.guid,
          group: "updated",
          content: `<a href="evernote:///view/${this.dataStoreService.user.id}/${this.dataStoreService.user.shardId}/${note.guid}/${note.guid}/" title="${note.title}">${abbreviateFilter(note.title, 40)}</a>`,
          start: moment(note.updated).toDate(),
          type: "point",
        };
        this.timelineItems.add(timelineItem);
      }
      for (let noteGuid in this.dataStoreService.timeLogs) {
        let noteTimeLogs = this.dataStoreService.timeLogs[noteGuid];
        for (var timeLogId in noteTimeLogs) {
          let timeLog: TimeLogEntity = noteTimeLogs[timeLogId];
          let noteTitle: string = notes[timeLog.noteGuid].title;
          let timelineItem: TimelineItem = {
            id: timeLog._id,
            group: timeLog.person,
            content: `<a href="evernote:///view/${this.dataStoreService.user["id"]}/${this.dataStoreService.user["shardId"]}/${timeLog.noteGuid}/${timeLog.noteGuid}/" title="${noteTitle} ${timeLog.comment}">${abbreviateFilter(noteTitle, 20)} ${abbreviateFilter(timeLog.comment, 20)}</a>`,
            start: moment(timeLog.date).toDate(),
            end: timeLog.spentTime ? moment(timeLog.date).add(timeLog.spentTime, 'minutes').toDate() : null,
            type: timeLog.spentTime ? 'range' : 'point',
          };
          this.timelineItems.add(timelineItem);
        }
      }
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
