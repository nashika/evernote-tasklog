<template lang="pug">
  section#notes-mode.p-3
    table.table.table-bordered.table-striped.table-hover.table-sm.table-striped
      tr
        th Title
        th(v-for="person in existPersons") {{person.name}}
        th Total
      tr(v-for="note in notes")
        td: a(:href="'evernote:///view/' + datastoreService.$vm.user.id + '/' + datastoreService.$vm.user.shardId + '/' + note.guid + '/' + note.guid + '/'") {{note.title}}
        td.text-right(v-for="person in existPersons")
          div(v-if="notesSpentTimes[note.guid] && notesSpentTimes[note.guid][person.id]")
            small ({{Math.round(notesSpentTimes[note.guid][person.id] / notesSpentTimes[note.guid]['$total'] * 100)}}%)&nbsp;
            | {{notesSpentTimes[note.guid][person.id] | spentTime}}
          div(v-if="notesProfits[note.guid] && notesProfits[note.guid][person.id]")
            | {{Math.round(notesProfits[note.guid][person.id])}}
        td.text-right
          div(v-if="notesSpentTimes[note.guid] && notesSpentTimes[note.guid]['$total']")
            | {{notesSpentTimes[note.guid]['$total'] | spentTime}}
          div(v-if="notesProfits[note.guid] && notesProfits[note.guid]['$total']")
            | {{Math.round(notesProfits[note.guid]['$total'])}}
      tr
        th Total
        td.text-right(v-for="person in existPersons")
          div(v-if="notesSpentTimes['$total'] && notesSpentTimes['$total'][person.id]")
            small ({{Math.round(notesSpentTimes['$total'][person.id] / notesSpentTimes['$total']['$total'] * 100)}}%)&nbsp;
            | {{notesSpentTimes['$total'][person.id] | spentTime}}
          div(v-if="notesProfits['$total'] && notesProfits['$total'][person.id]")
            | {{Math.round(notesProfits['$total'][person.id])}}
        td.text-right
          div(v-if="notesSpentTimes['$total'] && notesSpentTimes['$total']['$total']")
            | {{notesSpentTimes['$total']['$total'] | spentTime}}
          div(v-if="notesProfits['$total'] && notesProfits['$total']['$total']")
            | {{Math.round(notesProfits['$total']['$total'])}}
    b-modal(id="menu-modal", title="Menu", ok-only)
      b-button() test
    app-floating-action-button(enableReload, enableFilter, enableMenu, :filterParams="filterParams", @changeFilter="reload($event)")
</template>

<script lang="ts" src="./notes-mode.component.ts"></script>
