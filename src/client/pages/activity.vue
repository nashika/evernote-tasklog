<template lang="pug">
section#activity-mode.p-3
  .header
    .row
      .col-md-3
        button.btn.btn-secondary.btn-block(@click="changeDate(false)") Prev Date
      .col-md-6
        h1 {{moment(date).format('YYYY/MM/DD')}}
      .col-md-3
        button.btn.btn-secondary.btn-block(@click="changeDate(true)") Next Date
  .body
    section.activity-mode-item(v-for="note in archiveNotes")
      .header
        b-popover(placement="bottom", triggers="hover", title="Info", :content="detail(note)")
          h1
            a(:href="'evernote:///view/' + datastoreService.$vm.user.id + '/' + datastoreService.$vm.user.shardId + '/' + note.guid + '/' + note.guid + '/'")
              | {{moment(note.updated).format('HH:mm')}} {{note.title}}
            span.label.label-danger(v-if="modifies[note._id] && !modifies[note.archiveId].prevNote") #[i.fa.fa-plus] New
            span.label.label-primary #[i.fa.fa-book] {{notebookName(note)}}
            span.label.label-default(v-for="tagName in tagNames(note)") #[i.fa.fa-tag] {{tagName}}
      .body
        div(v-if="modifies[note.archiveId]")
          div(v-html="modifies[note.archiveId].diffHtml")
        div(v-else)
          i.fa.fa-spinner.fa-pulse
          | &nbsp;Loading...
  floating-action-button-component(enableReload, enableFilter, :filterParams="filterParams", @changeFilter="reload($event)")
</template>

<script lang="ts">
import { Component } from "nuxt-property-decorator";
import _ from "lodash";
import moment from "moment";
import Vue from "vue";
import * as diff from "diff";
import * as htmlToText from "html-to-text";
import diff2html from "diff2html";

import BaseComponent from "~/src/client/components/base.component";
import NoteEntity from "~/src/common/entity/note.entity";
import { INoteLogsServiceNoteFilterParams } from "~/src/client/service/note-logs.service";
import FloatingActionButtonComponent from "~/src/client/components/floating-action-button.vue";

interface IActivityModifyData {
  prevNote?: NoteEntity;
  diffPatch?: string;
  diffHtml?: string;
}

@Component({
  components: {
    FloatingActionButtonComponent,
  },
})
export default class ActivityComponent extends BaseComponent {
  filterParams: INoteLogsServiceNoteFilterParams = {};
  date: Date = new Date();
  modifies: { [archiveId: string]: IActivityModifyData } = {};
  archiveNotes: NoteEntity[] | null = [];

  async created() {}

  async mounted(): Promise<void> {
    await super.mounted();
    await this.reload();
  }

  async reload(
    filterParams: INoteLogsServiceNoteFilterParams = {}
  ): Promise<void> {
    if (filterParams) this.filterParams = filterParams;
    const noteFilterParams = _.clone(this.filterParams);
    noteFilterParams.start = moment(this.date).startOf("day");
    noteFilterParams.end = moment(this.date).endOf("day");
    noteFilterParams.archiveMinStepMinute = 10;
    this.modifies = {};
    this.archiveNotes = await this.$myService.noteLogs.getArchiveLogs(
      noteFilterParams
    );
    if (!this.archiveNotes) return;
    for (const note of this.archiveNotes) {
      const prevNote = await this.$myService.noteLogs.getPrevNote(
        this.archiveNotes,
        note,
        10
      );
      const modify: IActivityModifyData = {};
      modify.prevNote = prevNote;
      const oldText = this.makeDiffText(modify.prevNote);
      const newText = this.makeDiffText(note);
      modify.diffPatch = diff.createPatch(
        "Note Content",
        oldText,
        newText,
        "",
        "",
        { context: 0 }
      );
      modify.diffHtml = diff2html.html(modify.diffPatch);
      Vue.set(this.modifies, String(note.archiveId), modify);
    }
  }

  private makeDiffText(note: NoteEntity): string {
    if (!note) return "";
    const noteContent = note.content
      ?.replace(/<en-todo checked="false"\/>/g, "□")
      .replace(/<en-todo checked="true"\/>/g, "■")
      .replace(/<br\/>/g, "")
      .replace(/<\/div>/g, "<br/></div>");
    const plainContentText = htmlToText.htmlToText(noteContent ?? "");
    return `###Note Header###
Title: ${note.title}
Notebook: [${this.notebookName(note)}]
Tags: ${_.join(
      _.map(this.tagNames(note), (tagName) => `[${tagName}]`),
      " "
    )}

###Note Content###
${plainContentText}
`;
  }

  changeDate(direction: boolean) {
    this.date = moment(this.date)
      .add(direction ? 1 : -1, "days")
      .toDate();
    this.reload();
  }

  detail(note: NoteEntity): string {
    return `Updated: ${moment(note.updated).format("YYYY/MM/DD HH:mm:ss")}<br />
Created: ${moment(note.created).format("YYYY/MM/DD HH:mm:ss")}<br />
UpdateSequenceNum: ${note.updateSequenceNum}`;
  }

  notebookName(note: NoteEntity): string {
    return this.$myStore.datastore.notebooks[note.notebookGuid].name;
  }

  tagNames(note: NoteEntity): string[] {
    return _.map(
      note.tagGuids,
      (tagGuid) => this.$myStore.datastore.tags[tagGuid].name
    );
  }
}
</script>

<style lang="scss">
@import "../scss/lib";

section#activity-mode {
  > .header {
    h1 {
      margin: 0;
      font-size: 150%;
      text-align: center;
    }
  }

  > .body {
    section.activity-mode-item {
      margin: 10px 0px;
      border: $mono-lightest solid 1px;
      @include border-top-radius(5px);
      @include border-bottom-radius(5px);

      > .header {
        padding: 5px;
        background-color: $mono-lightest;
        @include border-top-radius(5px);

        h1 {
          margin: 0;
          padding: 0;
          font-size: 120%;
          font-weight: bold;

          span.label {
            margin: 0 5px;
          }
        }
      }

      > .body {
        div.d2h-wrapper {
          div.d2h-file-wrapper {
            border: none;
            border-radius: 0;
            margin-bottom: 0;

            div.d2h-file-header {
              display: none;
            }

            div.d2h-file-diff {
              max-height: 200px;
              overflow-x: auto;
              overflow-y: auto;

              table.d2h-diff-table {
                tbody.d2h-diff-tbody {
                  tr {
                    td.d2h-code-linenumber {
                      display: none;
                    }

                    td {
                      div.d2h-code-line {
                        margin-left: 0;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
