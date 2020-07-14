<template lang="pug">
section#timeline-mode
  #timeline
  app-floating-action-button(enableReload, enableFilter, :filterParams="filterParams", @changeFilter="reload($event)")
</template>

<script lang="ts">
import moment from "moment";
import _ from "lodash";
import { Component } from "nuxt-property-decorator";
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline";

import BaseComponent from "~/src/client/components/base.component";
import { IDatastoreServiceNoteFilterParams } from "~/src/client/service/note-logs.service";
import configLoader from "~/src/common/util/config-loader";
import NoteEntity from "~/src/common/entity/note.entity";
import { abbreviateFilter } from "~/src/client/filter/abbreviate.filter";
import TimeLogEntity from "~/src/common/entity/time-log.entity";

interface TimelineItem {
  id: string;
  group: number | string;
  content: string;
  start: Date;
  end?: Date;
  type: string;
}

@Component
export default class TimelineModeComponent extends BaseComponent {
  filterParams: IDatastoreServiceNoteFilterParams = {};
  timeline: any = null;
  timelineItems: any = null;
  timelineGroups: any = null;
  start: moment.Moment = moment().startOf("day");
  end: moment.Moment = moment().endOf("day");
  startView: moment.Moment = moment().startOf("day");
  endView: moment.Moment = moment().endOf("day");

  async mounted(): Promise<void> {
    await this.reload();
  }

  async reload(
    filterParams: IDatastoreServiceNoteFilterParams | null = null
  ): Promise<void> {
    if (filterParams) this.filterParams = filterParams;
    let noteFilterParams = _.clone(this.filterParams);
    noteFilterParams.start = this.start;
    noteFilterParams.end = this.end;
    let noteLogsResult = await this.$myService.noteLogs.getNoteLogs(
      noteFilterParams
    );
    if (!noteLogsResult) return;
    if (this.timeline) this.timeline.destroy();
    this.timelineGroups = new DataSet();
    this.timelineItems = new DataSet();
    let sortedPersons: AppConfig.IPersonConfig[] = _.sortBy(
      configLoader.app.persons,
      person => (this.$myStore.datastore.currentPersonId == person.id ? 1 : 2)
    );
    for (let person of sortedPersons)
      this.timelineGroups.add({
        id: `person-${person.id}`,
        content: person.name,
      });
    this.timelineGroups.add({ id: "updated", content: "Update" });
    let notes: { [noteGuid: string]: NoteEntity } = {};
    for (let noteGuid in noteLogsResult.notes) {
      let note: NoteEntity = noteLogsResult.notes[noteGuid];
      notes[note.guid] = note;
      let timelineItem: TimelineItem = {
        id: note.guid,
        group: "updated",
        content: `<a href="evernote:///view/${
          this.$myStore.datastore.user?.id
        }/${this.$myStore.datastore.user?.shardId}/${note.guid}/${
          note.guid
        }/" title="${note.title}">${abbreviateFilter(note.title, 40)}</a>`,
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
          content: `<a href="evernote:///view/${
            this.$myStore.datastore.user?.id
          }/${this.$myStore.datastore.user?.shardId}/${timeLog.noteGuid}/${
            timeLog.noteGuid
          }/" title="${note.title} ${timeLog.comment}">${abbreviateFilter(
            note.title,
            20
          )} ${abbreviateFilter(timeLog.comment ?? "", 20)}</a>`,
          start: moment(timeLog.date).toDate(),
          end: timeLog.spentTime
            ? moment(timeLog.date)
              .add(timeLog.spentTime, "minutes")
              .toDate()
            : undefined,
          type: timeLog.spentTime ? "range" : "point",
        };
        this.timelineItems.add(timelineItem);
      }
    }
    let container: HTMLElement = <HTMLElement>(
      this.$el.querySelector("#timeline")
    );
    // set working time
    let hiddenDates: {
      start: moment.Moment;
      end: moment.Moment;
      repeat: string;
    }[];
    if (configLoader.app.workingTimeStart && configLoader.app.workingTimeEnd)
      hiddenDates = [
        {
          start: moment()
            .subtract(1, "days")
            .startOf("day")
            .hour(configLoader.app.workingTimeEnd),
          end: moment()
            .startOf("day")
            .hour(configLoader.app.workingTimeStart),
          repeat: "daily",
        },
      ];
    else hiddenDates = [];
    this.timeline = new Timeline(
      container,
      this.timelineItems,
      this.timelineGroups,
      <any>{
        margin: { item: 5 },
        height: window.innerHeight - 57,
        orientation: { axis: "both", item: "top" },
        start: this.startView.toDate(),
        end: this.endView.toDate(),
        order: (a: TimelineItem, b: TimelineItem) => {
          return a.start.getTime() - b.start.getTime();
        },
        hiddenDates: hiddenDates,
      }
    );
    this.timeline.on("rangechanged", (properties: { start: Date; end: Date }) =>
      this.onRangeChanged(properties)
    );
  }

  onRangeChanged(properties: { start: Date; end: Date }) {
    this.startView = moment(properties.start);
    this.endView = moment(properties.end);
    let currentStart = moment(properties.start).startOf("day");
    let currentEnd = moment(properties.end).endOf("day");
    if (
      currentStart.isSameOrAfter(this.start) &&
      currentEnd.isSameOrBefore(this.end)
    )
      return;
    if (!this.start || currentStart.isBefore(this.start))
      this.start = currentStart;
    if (!this.end || currentEnd.isAfter(this.end)) this.end = currentEnd;
    this.reload();
  }

  onResize() {
    this.timeline.setOptions({
      height: window.innerHeight - 90,
    });
  }
}
</script>
