<template lang="pug">
mixin item(to, icon, label)
  b-nav-item(to=to)
    fa(:icon="['fas', '"+ icon +"']")
    | &nbsp;#{label}

b-navbar.d-print-none(toggleable="sm", type="dark", variant="dark", fixed="top")
  b-navbar-toggle(target="nav-collapse")
  b-collapse#nav-collapse(is-nav)
    b-navbar-nav
      +item("/attendance", "id-card", "{{$t('common.attendance')}}")
      +item("/timeline", "clock", "{{$t('common.timeline')}}")
      +item("/notes", "sticky-note", "{{$tc('common.note')}}")
      +item("/activity", "history", "{{$t('common.activity')}}")
      +item("/constraint", "check-circle", "{{$t('common.constraint')}}")
  b-button(:variant="$datastoreService.$vm.currentPersonId ? 'warning' : 'outline-warning'", @click="$root.$emit('show::modal', 'person-modal')")
    i.fa.fa-user
    span.d-none.d-sm-inline &nbsp;{{personLabel}}
</template>

<script lang="ts">
import Component from "vue-class-component";
import BaseComponent from "~/src/client/components/base.component";

@Component({})
export default class NavigationComponent extends BaseComponent {
  get personLabel(): string | undefined {
    if (this.$datastoreService.$vm.currentPersonId)
      return this.$datastoreService.currentPerson?.name?.substr(0, 1);
    else return this.$ts("common.person");
  }
}
</script>
