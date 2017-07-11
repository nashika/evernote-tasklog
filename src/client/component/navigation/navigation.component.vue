<template lang="pug">
  mixin item(to, icon, label)
    b-nav-item(to=to)
      i.fa(class="fa-" + icon)
      span.hidden-xs-down &nbsp;#{label}

  b-navbar.hidden-print(toggleable, type="inverse", toggle-breakpoint="xl", variant="inverse", fixed="top")
    b-collapse(is-nav, id="nav-collapse")
      b-nav.mr-auto(is-nav-bar)
        +item("/attendance", "vcard", "Attendance")
        +item("/timeline", "clock-o", "Timeline")
        +item("/notes", "files-o", "Notes")
        +item("/activity", "history", "Activity")
      b-button(:variant="datastoreService.$vm.currentPersonId ? 'warning' : 'outline-warning'", @click="$root.$emit('show::modal', 'person-modal')")
        i.fa.fa-user
        span.hidden-sm-down &nbsp;{{personLabel}}
</template>

<script lang="ts" src="./navigation.component.ts"></script>
