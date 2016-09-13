import Component from "vue-class-component";
import _ = require("lodash");
import moment = require("moment");
let vis = require("vis");

import {BaseComponent} from "./base-component";
import {DataStoreService} from "../service/data-store-service";
import {clientServiceRegistry} from "../service/client-service-registry";
import {NoteEntity} from "../../common/entity/note-entity";
import {abbreviateFilter} from "../filter/abbreviate";
import {TimeLogEntity} from "../../common/entity/time-log-entity";

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
  },
})
export class TimelineComponent extends BaseComponent {

  dataStoreService: DataStoreService;
  timeline: any;
  timelineItems: any;
  timelineGroups: any;
  start: moment.Moment;
  end: moment.Moment;

  data(): any {
    return _.assign(super.data(), {
      dataStoreService: clientServiceRegistry.dataStore,
      timeline: null,
      timelineItems: null,
      timelineGroups: null,
      start: moment().startOf("day"),
      end: moment().endOf("day"),
    });
  }

  ready() {
    this.reload();
  }

  reload() {
    clientServiceRegistry.dataTransciever.reload({start: this.start, end: this.end, getContent: true}).then(() => {
      let container:HTMLElement = <HTMLElement>this.$el.querySelector("#timeline");
      // set working time
      let hiddenDates: {start: moment.Moment, end: moment.Moment, repeat: string}[];
      if (clientServiceRegistry.dataStore.settings && clientServiceRegistry.dataStore.settings["startWorkingTime"] && clientServiceRegistry.dataStore.settings["endWorkingTime"])
        hiddenDates = [{
          start: moment().subtract(1, "days").startOf("day").hour(clientServiceRegistry.dataStore.settings["endWorkingTime"]),
          end: moment().startOf("day").hour(clientServiceRegistry.dataStore.settings["startWorkingTime"]),
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
      if (!clientServiceRegistry.dataStore.settings || !clientServiceRegistry.dataStore.settings["persons"]) return;
      for (let person of clientServiceRegistry.dataStore.settings["persons"])
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
      this.$on("resize", this.onResize);
      this.$on("reload", this.onReload);
      // reload
      this.onReloadEnd();
    });
  }

  onRangeChanged(properties: {start: Date, end: Date}) {
    let currentStart = moment(properties.start).startOf("day");
    let currentEnd = moment(properties.end).endOf("day");
    if (currentStart.isSameOrAfter(this.start) && currentEnd.isSameOrBefore(this.end))
      return;
    if (!this.start || currentStart.isBefore(this.start)) this.start = currentStart;
    if (!this.end || currentEnd.isAfter(this.end)) this.end = currentEnd;
    this.onReload();
  };

  onReload() {
    clientServiceRegistry.dataTransciever.reload({start: this.start, end: this.end, getContent: true}).then(() => {
      this.onReloadEnd();
    });
  };

  onReloadEnd() {
    this.timelineItems.clear();
    let notes: {[noteGuid: string]: NoteEntity} = {};
    for (var noteGuid in clientServiceRegistry.dataStore.notes) {
      let note: NoteEntity = clientServiceRegistry.dataStore.notes[noteGuid];
      notes[note.guid] = note;
      let timelineItem: TimelineItem = {
        id: note.guid,
        group: "updated",
        content: `<a href="evernote:///view/${clientServiceRegistry.dataStore.user.id}/${clientServiceRegistry.dataStore.user.shardId}/${note.guid}/${note.guid}/" title="${note.title}">${abbreviateFilter(note.title, 40)}</a>`,
        start: moment(note.updated).toDate(),
        type: "point",
      };
      this.timelineItems.add(timelineItem);
    }
    for (let noteGuid in clientServiceRegistry.dataStore.timeLogs) {
      let noteTimeLogs = clientServiceRegistry.dataStore.timeLogs[noteGuid];
      for (var timeLogId in noteTimeLogs) {
        let timeLog: TimeLogEntity = noteTimeLogs[timeLogId];
        let noteTitle: string = notes[timeLog.noteGuid].title;
        let timelineItem: TimelineItem = {
          id: timeLog._id,
          group: timeLog.person,
          content: `<a href="evernote:///view/${clientServiceRegistry.dataStore.user["id"]}/${clientServiceRegistry.dataStore.user["shardId"]}/${timeLog.noteGuid}/${timeLog.noteGuid}/" title="${noteTitle} ${timeLog.comment}">${abbreviateFilter(noteTitle, 20)} ${abbreviateFilter(timeLog.comment, 20)}</a>`,
          start: moment(timeLog.date).toDate(),
          end: timeLog.spentTime ? moment(timeLog.date).add(timeLog.spentTime, 'minutes').toDate() : null,
          type: timeLog.spentTime ? 'range' : 'point',
        };
        this.timelineItems.add(timelineItem);
      }
    }
  };

  onResize() {
    this.timeline.setOptions({
      height: window.innerHeight - 90,
    });
  };

}
