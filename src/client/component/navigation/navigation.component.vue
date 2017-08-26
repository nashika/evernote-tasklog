<template lang="pug">
  mixin item(to, icon, label)
    b-nav-item(to=to)
      i.fa(class="fa-" + icon)
      | &nbsp;#{label}

  b-navbar.d-print-none(toggleable="sm", type="dark", variant="dark", fixed="top")
    b-nav-toggle(target="nav-collapse")
    b-collapse#nav-collapse(is-nav)
      b-nav.mr-auto(is-nav-bar)
        +item("/attendance", "vcard", "Attendance")
        +item("/timeline", "clock-o", "Timeline")
        +item("/notes", "files-o", "Notes")
        +item("/activity", "history", "Activity")
    b-button(:variant="datastoreService.$vm.currentPersonId ? 'warning' : 'outline-warning'", @click="$root.$emit('show::modal', 'person-modal')")
      i.fa.fa-user
      span.d-none.d-sm-inline &nbsp;{{personLabel}}
</template>

<script lang="ts" src="./navigation.component.ts"></script>
