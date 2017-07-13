<template lang="pug">
  nav#actions
    #filter.action.rounded-circle(v-if="enableFilter", @click="showFilterModal()")
      i.fa.fa-filter
    #reload.action.rounded-circle(v-if="enableReload", @click="$root.$emit('reload')")
      i.fa.fa-refresh
</template>

<style lang="scss">
  @import "../../scss/lib";

  nav#actions {
    position: fixed;
    bottom: 0;
    right: 0;
    padding: 10px;

    .action {
      display: flex;
      margin: 10px;
      width: 40px;
      height: 40px;
      justify-content: center;
      align-items: center;
      font-size: 20px;
      color: white;
      opacity: 0.8;
      cursor: pointer;
      background-color: $brand-info;
      box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.5);

      &, &::before, &::after {
        transition: all 0.5s;
      }

      &:hover {
        background-color: $brand-primary;
      }
    }
  }
</style>

<script lang="ts" src="./floating-action-button.ts"></script>
