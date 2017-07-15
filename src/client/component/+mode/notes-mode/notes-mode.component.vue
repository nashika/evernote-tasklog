<template lang="pug">
  section#notes-mode.p-3
    b-table(bordered, striped, hover, small, responsive, head-variant="inverse", foot-clone, foot-variant="default",
    :fields="fields", :items="lodash.values(notes)")
      template(slot="title", scope="data")
        a(:href="'evernote:///view/' + datastoreService.$vm.user.id + '/' + datastoreService.$vm.user.shardId + '/' + data.item.guid + '/' + data.item.guid + '/'") {{data.item.title}}
      template(v-for="person in existPersons", :slot="'person-' + person.id", scope="data")
        .text-right(v-if="notesSpentTimes[data.item.guid] && notesSpentTimes[data.item.guid][person.id]")
          small ({{Math.round(notesSpentTimes[data.item.guid][person.id] / notesSpentTimes[data.item.guid]['$total'] * 100)}}%)&nbsp;
          | {{notesSpentTimes[data.item.guid][person.id] | spentTime}}
        .text-right(v-if="notesProfits[data.item.guid] && notesProfits[data.item.guid][person.id]")
          | {{Math.round(notesProfits[data.item.guid][person.id])}}
      template(slot="total", scope="data")
        .text-right(v-if="notesSpentTimes[data.item.guid] && notesSpentTimes[data.item.guid]['$total']")
          | {{notesSpentTimes[data.item.guid]['$total'] | spentTime}}
        .text-right(v-if="notesProfits[data.item.guid] && notesProfits[data.item.guid]['$total']")
          | {{Math.round(notesProfits[data.item.guid]['$total'])}}
      template(slot="FOOT_title", scope="data") Total
      template(v-for="person in existPersons", :slot="'FOOT_person-' + person.id", scope="data")
        .text-right(v-if="notesSpentTimes['$total'] && notesSpentTimes['$total'][person.id]")
          small ({{Math.round(notesSpentTimes['$total'][person.id] / notesSpentTimes['$total']['$total'] * 100)}}%)&nbsp;
          | {{notesSpentTimes['$total'][person.id] | spentTime}}
        .text-right(v-if="notesProfits['$total'] && notesProfits['$total'][person.id]")
          | {{Math.round(notesProfits['$total'][person.id])}}
      template(slot="FOOT_total", scope="data")
        .text-right(v-if="notesSpentTimes['$total'] && notesSpentTimes['$total']['$total']")
          | {{notesSpentTimes['$total']['$total'] | spentTime}}
        .text-right(v-if="notesProfits['$total'] && notesProfits['$total']['$total']")
          | {{Math.round(notesProfits['$total']['$total'])}}
    b-modal(id="menu-modal", title="Menu", ok-only)
      b-button() test
    app-floating-action-button(enableReload, enableFilter, enableMenu, :filterParams="filterParams", @changeFilter="reload($event)")
</template>

<script lang="ts" src="./notes-mode.component.ts"></script>
