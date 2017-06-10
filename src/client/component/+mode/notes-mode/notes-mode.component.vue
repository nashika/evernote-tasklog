<template lang="pug">
  section.notes-mode.p-3
    table.table.table-bordered.table-striped.table-hover.table-sm.table-striped
      tr
        th Title
        th(v-for="person in existPersons") {{person}}
        th Total
      tr(v-for="note in notes")
        td: a(:href="'evernote:///view/' + datastoreService.user.id + '/' + datastoreService.user.shardId + '/' + note.guid + '/' + note.guid + '/'") {{note.title}}
        td.text-right(v-for="person in existPersons.concat(['$total'])")
          div(v-if="notesSpentTimes[note.guid] && notesSpentTimes[note.guid][person]")
            small ({{Math.round(notesSpentTimes[note.guid][person] / notesSpentTimes[note.guid]['$total'] * 100)}}%)&nbsp;
            | {{notesSpentTimes[note.guid][person] | spentTime}}
          div(v-if="notesProfits[note.guid] && notesProfits[note.guid][person]")
            | {{Math.round(notesProfits[note.guid][person])}}
      tr
        th Total
        td.text-right(v-for="person in existPersons.concat('$total')")
          div(v-if="notesSpentTimes['$total'] && notesSpentTimes['$total'][person]")
            small ({{Math.round(notesSpentTimes['$total'][person] / notesSpentTimes['$total']['$total'] * 100)}}%)&nbsp;
            | {{notesSpentTimes['$total'][person] | spentTime}}
          div(v-if="notesProfits['$total'] && notesProfits['$total'][person]")
            | {{Math.round(notesProfits['$total'][person])}}
</template>

<script lang="ts" src="./notes-mode.component.ts"></script>
