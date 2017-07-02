<template lang="pug">
  .form-inline
    b-form-input(type="number", size="sm", v-model="hour", @change="change()", min="0", max="23", style="width: 4em")
    | &nbsp;:&nbsp;
    b-form-input(type="number", size="sm", v-model="minute", @change="change()", min="0", max="59", style="width: 4em")
</template>

<script lang="ts" src="./timepicker-attendance-mode.component.ts"></script>
