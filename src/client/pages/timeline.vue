<template lang="pug">
section#timeline-mode
  #timeline
  floating-action-button-component(enableReload, enableFilter, :filterParams="filterParams", @changeFilter="reload($event)")
</template>

<script lang="ts">
import moment from "moment";
import _ from "lodash";
import { Component } from "nuxt-property-decorator";
import {
  DataGroup,
  DataItem,
  Timeline,
  TimelineHiddenDateOption,
} from "vis-timeline";

import BaseComponent from "~/src/client/components/base.component";
import { INoteLogsServiceNoteFilterParams } from "~/src/client/service/note-logs.service";
import { appConfigLoader } from "~/src/common/util/app-config-loader";
import NoteEntity from "~/src/common/entity/note.entity";
import { abbreviateFilter } from "~/src/client/filter/abbreviate.filter";
import TimeLogEntity from "~/src/common/entity/time-log.entity";
import FloatingActionButtonComponent from "~/src/client/components/floating-action-button.vue";
import { exclusiveExecSingle } from "~/src/common/util/exclusive-exec";

@Component({
  components: {
    FloatingActionButtonComponent,
  },
})
export default class TimelineModeComponent extends BaseComponent {
  filterParams: INoteLogsServiceNoteFilterParams = {};
  timeline: any = null;
  timelineItems: DataItem[] = [];
  timelineGroups: DataGroup[] = [];
  start: moment.Moment = moment().startOf("day");
  end: moment.Moment = moment().endOf("day");
  startView: moment.Moment = moment().startOf("day");
  endView: moment.Moment = moment().endOf("day");

  async mounted(): Promise<void> {
    await this.reload();
    this.$myService.socketIoClient.on(this, "sync::update", this.reload);
  }

  private async reload(
    filterParams: INoteLogsServiceNoteFilterParams | null = null
  ): Promise<void> {
    await exclusiveExecSingle(
      this,
      async () => {
        if (filterParams) this.filterParams = filterParams;
        const noteFilterParams = _.clone(this.filterParams);
        noteFilterParams.start = this.start;
        noteFilterParams.end = this.end;
        const noteLogsResult = await this.$myService.noteLogs.getNoteLogs(
          noteFilterParams
        );
        if (!noteLogsResult) return;
        if (this.timeline) this.timeline.destroy();
        this.timelineGroups = [];
        this.timelineItems = [];
        const sortedPersons: AppConfig.IPersonConfig[] = _.sortBy(
          appConfigLoader.app.persons,
          (person) =>
            this.$myStore.datastore.currentPersonId === person.id ? 1 : 2
        );
        for (const person of sortedPersons)
          this.timelineGroups.push({
            id: `person-${person.id}`,
            content: person.name,
          });
        this.timelineGroups.push({ id: "updated", content: "Update" });
        const notes: { [noteGuid: string]: NoteEntity } = {};
        for (const noteGuid in noteLogsResult.notes) {
          const note: NoteEntity = noteLogsResult.notes[noteGuid];
          notes[note.guid] = note;
          const timelineItem: DataItem = {
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
          this.timelineItems.push(timelineItem);
        }
        for (const noteGuid in noteLogsResult.timeLogs) {
          const noteTimeLogs = noteLogsResult.timeLogs[noteGuid];
          for (const timeLogId in noteTimeLogs) {
            const timeLog: TimeLogEntity = noteTimeLogs[timeLogId];
            const note: NoteEntity = notes[timeLog.noteGuid];
            if (!note) continue;
            const timelineItem: DataItem = {
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
            this.timelineItems.push(timelineItem);
          }
        }
        const container: HTMLElement | null = this.$el.querySelector(
          "#timeline"
        );
        // 稼働時間以外を隠す設定
        let hiddenDates: TimelineHiddenDateOption[];
        if (
          appConfigLoader.app.workingTimeStart &&
          appConfigLoader.app.workingTimeEnd
        )
          hiddenDates = [
            {
              start: moment()
                .subtract(1, "days")
                .startOf("day")
                .hour(appConfigLoader.app.workingTimeEnd)
                .toDate(),
              end: moment()
                .startOf("day")
                .hour(appConfigLoader.app.workingTimeStart)
                .toDate(),
              repeat: "daily",
            },
          ];
        else hiddenDates = [];
        if (container)
          this.timeline = new Timeline(
            container,
            this.timelineItems,
            this.timelineGroups,
            {
              margin: { item: 5 },
              height: window.innerHeight - 57,
              orientation: { axis: "both", item: "top" },
              start: this.startView.toDate(),
              end: this.endView.toDate(),
              order: (a: DataItem, b: DataItem) => {
                return moment(a.start).valueOf() - moment(b.start).valueOf();
              },
              hiddenDates,
            }
          );
        this.timeline.on(
          "rangechanged",
          (properties: { start: Date; end: Date }) =>
            this.onRangeChanged(properties)
        );
      },
      this.reload
    );
  }

  onRangeChanged(properties: { start: Date; end: Date }) {
    this.startView = moment(properties.start);
    this.endView = moment(properties.end);
    const currentStart = moment(properties.start).startOf("day");
    const currentEnd = moment(properties.end).endOf("day");
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

<style lang="scss">
@import "../../../node_modules/vis-timeline/styles/vis-timeline-graph2d.css";

.vis-item .vis-item-overflow {
  overflow: visible;
}
</style>
