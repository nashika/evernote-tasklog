<template lang="pug">
  section#notes-mode.p-3
    b-input-group.mb-2
      b-input-group-addon(slot="left"): i.fa.fa-search
      b-form-input(v-model="filterText", placeholder="Type to Search")
    b-table(bordered, striped, hover, small, responsive, head-variant="inverse", foot-clone, foot-variant="default",
    :fields="fields", :items="lodash.values(notes)", :filter="filterText")
      template(slot="notebook", scope="data")
        | {{datastoreService.$vm.notebooks[data.item.notebookGuid].name}}
      template(slot="title", scope="data")
        a(:href="'evernote:///view/' + datastoreService.$vm.user.id + '/' + datastoreService.$vm.user.shardId + '/' + data.item.guid + '/' + data.item.guid + '/'") {{data.item.title}}
      template(v-for="person in existPersons", :slot="'person-' + person.id", scope="data")
        .text-right(v-if="lodash.get(notesSpentTimes, [data.item.guid, '$' + person.id])")
          small ({{Math.round(notesSpentTimes[data.item.guid]['$' + person.id] / notesSpentTimes[data.item.guid]['$total'] * 100)}}%)&nbsp;
          | {{notesSpentTimes[data.item.guid]['$' + person.id] | spentTime}}
        .text-right(v-if="lodash.get(notesProfits, [data.item.guid, '$' + person.id])")
          | {{notesProfits[data.item.guid]['$' + person.id] | numeral('0,0')}}
      template(slot="total", scope="data")
        .text-right(v-if="lodash.get(notesSpentTimes, [data.item.guid, '$total'])")
          | {{notesSpentTimes[data.item.guid]['$total'] | spentTime}}
        .text-right(v-if="lodash.get(notesProfits, [data.item.guid, '$total'])")
          small(v-if="lodash.get(notesProfits, [data.item.guid, '$total']) && lodash.get(notesSpentTimes, [data.item.guid, '$total'])")
            | ({{notesProfits[data.item.guid]['$total'] / notesSpentTimes[data.item.guid]['$total'] * 60 | numeral('0,0')}}/h)&nbsp;
          | {{notesProfits[data.item.guid]['$total'] | numeral('0,0')}}
      template(slot="profitPerHour", scope="data")
      template(slot="FOOT_title", scope="data") Total
      template(v-for="person in existPersons", :slot="'FOOT_person-' + person.id", scope="data")
        .text-right(v-if="lodash.get(notesSpentTimes, ['$total', '$' + person.id])")
          small ({{Math.round(notesSpentTimes['$total']['$' + person.id] / notesSpentTimes['$total']['$total'] * 100)}}%)&nbsp;
          | {{notesSpentTimes['$total']['$' + person.id] | spentTime}}
        .text-right(v-if="lodash.get(notesProfits, ['$total', '$' + person.id])")
          | {{notesProfits['$total']['$' + person.id] | numeral('0,0')}}
      template(slot="FOOT_total", scope="data")
        .text-right(v-if="lodash.get(notesSpentTimes, ['$total', '$total'])")
          | {{notesSpentTimes['$total']['$total'] | spentTime}}
        .text-right(v-if="lodash.get(notesProfits, ['$total', '$total'])")
          small(v-if="lodash.get(notesProfits, ['$total', '$total']) && lodash.get(notesSpentTimes, ['$total', '$total'])")
            | ({{notesProfits['$total']['$total'] / notesSpentTimes['$total']['$total'] * 60 | numeral('0,0')}}/h)&nbsp;
          | {{notesProfits['$total']['$total'] | numeral('0,0')}}
    b-modal(id="menu-modal", title="Menu", ok-only, @hidden="reload()")
      .h6 Filter profit type
      b-form-radio(v-model="filterProfitType", :options="filterProfitTypeOptions", stacked)
    app-floating-action-button(enableReload, enableFilter, enableMenu, :filterParams="filterParams", @changeFilter="reload($event)")
</template>

<script lang="ts" src="./notes-mode.component.ts"></script>
