<template lang="pug">
  section#timeline-mode
    #timeline
    #actions
      #filter.action.rounded-circle
        i.fa.fa-filter
      #reload.action.rounded-circle
        i.fa.fa-refresh
</template>

<style lang="scss">
  @import "../../../scss/lib";

  #actions {
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

<script lang="ts" src="./timeline-mode.component.ts"></script>
