<template lang="pug">
  section.activity-mode.p-3
    .header
      .row
        .col-md-3
          button.btn.btn-secondary.btn-block(@click="changeDate(false)") Prev Date
        .col-md-6
          h1 {{moment(date).format('YYYY/MM/DD')}}
        .col-md-3
          button.btn.btn-secondary.btn-block(@click="changeDate(true)") Next Date
    .body
      section.activity-mode-item(v-for="note in datastoreService.noteArchives")
        .header
          b-popover(placement="bottom", triggers="hover", title="Info", :content="detail(note)")
            h1
              a(:href="'evernote:///view/' + datastoreService.user.id + '/' + datastoreService.user.shardId + '/' + note.guid + '/' + note.guid + '/'")
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
</template>

<style lang="scss">
  @import "../../../scss/lib";

  section.activity-mode {

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

<script lang="ts" src="./activity-mode.component.ts"></script>
