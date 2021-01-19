<template lang="pug">
mixin item(to, icon, label)
  b-nav-item(to=to)
    fa(:icon="['fas', '"+ icon +"']")
    | &nbsp;#{label}

b-navbar.d-print-none(toggleable="sm", type="dark", variant="dark", fixed="top")
  b-navbar-toggle(target="nav-collapse")
  b-collapse#nav-collapse(is-nav)
    b-navbar-nav
      +item("/attendance", "id-card", "勤怠")
      +item("/timeline", "clock", "時系列")
      +item("/notes", "sticky-note", "ノート")
      +item("/activity", "history", "活動")
      +item("/constraint", "check-circle", "制約")
  b-button(:variant="$myStore.datastore.currentPersonId ? 'warning' : 'outline-warning'", @click="$bvModal.show('person-modal')")
    i.fa.fa-user
    span.d-none.d-sm-inline &nbsp;{{personLabel}}
</template>

<script lang="ts">
import { Component } from "nuxt-property-decorator";

import { BaseComponent } from "~/src/client/components/base.component";

@Component
export default class NavigationComponent extends BaseComponent {
  get personLabel(): string | undefined {
    if (this.$myStore.datastore.currentPersonId)
      return this.$myStore.datastore.currentPerson?.name?.substr(0, 1);
    else return "担当者";
  }
}
</script>
