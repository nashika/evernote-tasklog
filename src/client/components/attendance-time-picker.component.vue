<template lang="pug">
.form-inline
  b-form-input(type="number", size="sm", v-model="hour", @change="change()", min="0", max="23", style="width: 4em")
  | &nbsp;:&nbsp;
  b-form-input(type="number", size="sm", v-model="minute", @change="change()", min="0", max="59", style="width: 4em")
</template>

<script lang="ts">
import _ from "lodash";
import { Component, Prop } from "nuxt-property-decorator";

import { BaseComponent } from "~/src/client/components/base.component";

@Component
export default class AttendanceTimePickerComponent extends BaseComponent {
  @Prop({ type: Number })
  value!: number | null;

  hour: string = "";
  minute: string = "";

  async mounted(): Promise<void> {
    if (_.isNumber(this.value)) {
      this.hour = String(Math.floor(this.value / 60));
      this.minute = String(this.value % 60);
    }
  }

  change(): void {
    let value: number | null = null;
    if (this.hour && this.minute)
      value = _.toInteger(this.hour) * 60 + _.toInteger(this.minute);
    this.$emit("input", value);
    this.$emit("change");
  }
}
</script>
