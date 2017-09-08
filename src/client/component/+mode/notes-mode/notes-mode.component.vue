<template lang="pug">
  section#notes-mode.p-3
    b-input-group.mb-2
      b-input-group-addon(slot="left"): i.fa.fa-search
      b-form-input(v-model="filterText", placeholder="Type to Search")
    b-table(bordered, striped, hover, small, responsive, head-variant="inverse", foot-clone, foot-variant="default",
    :fields="fields", :items="lodash.values(records)", :filter="filterText")
      template(slot="title", scope="row")
        a(:href="'evernote:///view/' + datastoreService.$vm.user.id + '/' + datastoreService.$vm.user.shardId + '/' + row.item.guid + '/' + row.item.guid + '/'") {{row.item.title}}
      template(slot="updated", scope="row")
        .text-right {{moment(row.item.updated).format('M/DD HH:mm')}}
      template(v-for="person in existPersons", :slot="'person-' + person.id", scope="row")
        .text-right(v-if="row.item.persons['$' + person.id].spentTime")
          small ({{Math.round(row.item.persons['$' + person.id].spentTime / row.item.total.spentTime * 100)}}%)&nbsp;
          | {{row.item.persons['$' + person.id].spentTime | spentTime}}
        .text-right(v-if="row.item.persons['$' + person.id].profit")
          | {{row.item.persons['$' + person.id].profit | numeral('0,0')}}
      template(slot="total", scope="row")
        .text-right(v-if="row.item.total.spentTime")
          | {{row.item.total.spentTime | spentTime}}
        .text-right(v-if="row.item.total.profit")
          small(v-if="row.item.total.profit && row.item.total.spentTime")
            | ({{row.item.total.profit / row.item.total.spentTime * 60 | numeral('0,0')}}/h)&nbsp;
          | {{row.item.total.profit | numeral('0,0')}}
      template(slot="FOOT_title", scope="row") Total
      template(v-for="person in existPersons", :slot="'FOOT_person-' + person.id", scope="row")
        .text-right(v-if="totalRecord.persons['$' + person.id].spentTime")
          small ({{Math.round(totalRecord.persons['$' + person.id].spentTime / totalRecord.total.spentTime * 100)}}%)&nbsp;
          | {{totalRecord.persons['$' + person.id].spentTime | spentTime}}
        .text-right(v-if="totalRecord.persons['$' + person.id].profit")
          | {{totalRecord.persons['$' + person.id].profit | numeral('0,0')}}
      template(slot="FOOT_total", scope="row")
        template(v-if="totalRecord.total")
          .text-right(v-if="totalRecord.total.spentTime")
            | {{totalRecord.total.spentTime | spentTime}}
          .text-right(v-if="totalRecord.total.profit")
            small(v-if="totalRecord.total.profit && totalRecord.total.spentTime")
              | ({{totalRecord.total.profit / totalRecord.total.spentTime * 60 | numeral('0,0')}}/h)&nbsp;
            | {{totalRecord.total.profit | numeral('0,0')}}
    b-modal(id="menu-modal", title="Menu", ok-only, @hidden="reload()")
      .h6 Display columns
      b-form-checkbox(v-model="displayColumns.notebook") Notebook
      b-form-checkbox(v-model="displayColumns.updated") Updated
      .h6 Filter profit type
      b-form-radio(v-model="filterProfitType", :options="filterProfitTypeOptions", stacked)
    app-floating-action-button(enableReload, enableFilter, enableMenu, :filterParams="filterParams", @changeFilter="reload($event)")
</template>

<script lang="ts" src="./notes-mode.component.ts"></script>
