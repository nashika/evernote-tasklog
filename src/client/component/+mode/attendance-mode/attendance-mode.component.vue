<template lang="pug">
  section#attendance-mode
    .container
      .row.my-2
        .col-sm-4
          .form-group
            label {{$t('common.person')}}
            b-form-select(v-model="personId", :options="persons", value-field="id", text-field="name")
        .col-sm-4
          .form-group
            label {{$t('common.year')}}
            b-form-input(v-model="strYear", type="number", min="2000", max="2099", step="1", @change="reload()")
        .col-sm-4
          .form-group
            label {{$t('common.month')}}
            b-form-input(v-model="strMonth", type="number", min="1", max="12", step="1", @change="reload()")
      .row.my-2(v-if="todayAttendance && personId == datastoreService.$vm.currentPersonId && year == moment().year() && month == moment().month() + 1")
        .col-sm-6
          b-button(variant="primary", size="lg", block, :disabled="!!todayAttendance.arrivalTime", @click="arrival()") #[i.fa.fa-sign-in] {{$t('common.arrival')}}
        .col-sm-6
          b-button(variant="primary", size="lg", block, :disabled="!todayAttendance.arrivalTime || !!todayAttendance.departureTime", @click="departure()") #[i.fa.fa-sign-out] {{$t('common.departure')}}
      b-table(bordered, small, striped, hover, responsive, head-variant="inverse", :fields="fields", :items="attendances")
        template(slot="day", scope="data")
          | {{data.item.day}} ({{moment({year: data.item.year, month: data.item.month - 1, day: data.item.day}).format('ddd')}})
        template(slot="arrival", scope="data")
          app-timepicker-attendance-mode(v-model="data.item.arrivalTime", @change="changeRow(data.index)")
        template(slot="departure", scope="data")
          app-timepicker-attendance-mode(v-model="data.item.departureTime", @change="changeRow(data.index)")
        template(slot="rest", scope="data")
          app-timepicker-attendance-mode(v-model="data.item.restTime", @change="changeRow(data.index)")
        template(slot="remarks", scope="data")
          b-form-input(size="sm", v-model="data.item.remarks", @change="changeRow(data.index)")
        template(slot="action", scope="data")
          b-button(variant="primary", size="sm", :disabled="!updateFlags[data.index]", @click="save(data.item)") {{$t('common.update')}}
          b-button(variant="danger", size="sm", :disabled="!createFlags[data.index]", @click="remove(data.item)") {{$t('common.delete')}}
      .my-3.text-right
        b-button(variant="secondary", size="sm", @click="exportCsv()") Export CSV
</template>

<script lang="ts" src="./attendance-mode.component.ts"></script>
