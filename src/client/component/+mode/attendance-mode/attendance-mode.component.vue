<template lang="pug">
  section#attendance-mode
    .container
      .row.my-2
        .col-sm-4
          .form-group
            label Person
            b-form-select.form-control(v-model="personId", :options="persons", value-field="id", text-field="name")
        .col-sm-4
          .form-group
            label Year
            b-form-input(v-model="year", type="number", min="2000", max="2099", step="1", @change="reload()")
        .col-sm-4
          .form-group
            label Month
            b-form-input(v-model="month", type="number", min="1", max="12", step="1", @change="reload()")
      b-table(bordered, small, striped, hover, :fields="fields", :items="attendances")
</template>

<script lang="ts" src="./attendance-mode.component.ts"></script>
