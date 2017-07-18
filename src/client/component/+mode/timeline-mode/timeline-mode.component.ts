import Component from "vue-class-component";
import moment = require("moment");
import {DataSet, Timeline} from "vis";
import * as _ from "lodash";

import BaseComponent from "../../base.component";
import {DatastoreService, IDatastoreServiceNoteFilterParams} from "../../../service/datastore.service";
import {NoteEntity} from "../../../../common/entity/note.entity";
import {abbreviateFilter} from "../../../filter/abbreviate.filter";
import {TimeLogEntity} from "../../../../common/entity/time-log.entity";
import {container} from "../../../inversify.config";
import {configLoader, IPersonConfig} from "../../../../common/util/config-loader";

interface TimelineItem {
  id: string,
  group: number | string,
  content: string,
  start: Date,
  end?: Date,
  type: string,
}

@Component({})
export default class TimelineModeComponent extends BaseComponent {

  datastoreService: DatastoreService = container.get(DatastoreService);

  filterParams: IDatastoreServiceNoteFilterParams = {};
  timeline: any = null;
  timelineItems: any = null;
  timelineGroups: any = null;
  start: moment.Moment = moment().startOf("day");
  end: moment.Moment = moment().endOf("day");
  startView: moment.Moment = moment().startOf("day");
  endView: moment.Moment = moment().endOf("day");

  constructor() {
    super();
  }

  async mounted(): Promise<void> {
    await this.reload();
  }

  async reload(filterParams: IDatastoreServiceNoteFilterParams = null): Promise<void> {
    if (filterParams) this.filterParams = filterParams;
    let noteFilterParams = _.clone(this.filterParams);
    noteFilterParams.start = this.start;
    noteFilterParams.end = this.end;
    let noteLogsResult = await this.datastoreService.getNoteLogs(noteFilterParams);
    if (!noteLogsResult) return;
    if (this.timeline) this.timeline.destroy();
    this.timelineGroups = new DataSet();
    this.timelineItems = new DataSet();
    let sortedPersons: IPersonConfig[] = _.sortBy(configLoader.app.persons,
      person => this.datastoreService.$vm.currentPersonId == person.id ? 1 : 2);
    for (let person of sortedPersons)
      this.timelineGroups.add({id: `person-${person.id}`, content: person.name});
    this.timelineGroups.add({id: "updated", content: "Update"});
    let notes: { [noteGuid: string]: NoteEntity } = {};
    for (var noteGuid in noteLogsResult.notes) {
      let note: NoteEntity = noteLogsResult.notes[noteGuid];
      notes[note.guid] = note;
      let timelineItem: TimelineItem = {
        id: note.guid,
        group: "updated",
        content: `<a href="evernote:///view/${this.datastoreService.$vm.user.id}/${this.datastoreService.$vm.user.shardId}/${note.guid}/${note.guid}/" title="${note.title}">${abbreviateFilter(note.title, 40)}</a>`,
        start: moment(note.updated).toDate(),
        type: "point",
      };
      this.timelineItems.add(timelineItem);
    }
    for (let noteGuid in noteLogsResult.timeLogs) {
      let noteTimeLogs = noteLogsResult.timeLogs[noteGuid];
      for (let timeLogId in noteTimeLogs) {
        let timeLog: TimeLogEntity = noteTimeLogs[timeLogId];
        let note: NoteEntity = notes[timeLog.noteGuid];
        if (!note) continue;
        let timelineItem: TimelineItem = {
          id: String(timeLog.id),
          group: `person-${timeLog.personId}`,
          content: `<a href="evernote:///view/${this.datastoreService.$vm.user["id"]}/${this.datastoreService.$vm.user["shardId"]}/${timeLog.noteGuid}/${timeLog.noteGuid}/" title="${note.title} ${timeLog.comment}">${abbreviateFilter(note.title, 20)} ${abbreviateFilter(timeLog.comment, 20)}</a>`,
          start: moment(timeLog.date).toDate(),
          end: timeLog.spentTime ? moment(timeLog.date).add(timeLog.spentTime, 'minutes').toDate() : null,
          type: timeLog.spentTime ? 'range' : 'point',
        };
        this.timelineItems.add(timelineItem);
      }
    }
    let container: HTMLElement = <HTMLElement>this.$el.querySelector("#timeline");
    // set working time
    let hiddenDates: { start: moment.Moment, end: moment.Moment, repeat: string }[];
    if (configLoader.app.workingTimeStart && configLoader.app.workingTimeEnd)
      hiddenDates = [{
        start: moment().subtract(1, "days").startOf("day").hour(configLoader.app.workingTimeEnd),
        end: moment().startOf("day").hour(configLoader.app.workingTimeStart),
        repeat: "daily",
      }];
    else
      hiddenDates = [];
    this.timeline = new Timeline(container, this.timelineItems, this.timelineGroups, <any>{
      margin: {item: 5},
      height: window.innerHeight - 57,
      orientation: {axis: "both", item: "top"},
      start: this.startView.toDate(),
      end: this.endView.toDate(),
      order: (a: TimelineItem, b: TimelineItem) => {
        return a.start.getTime() - b.start.getTime();
      },
      hiddenDates: hiddenDates,
    });
    this.timeline.on("rangechanged", (properties: { start: Date, end: Date }) => this.onRangeChanged(properties));
  }

  onRangeChanged(properties: { start: Date, end: Date }) {
    this.startView = moment(properties.start);
    this.endView = moment(properties.end);
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
