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
      b-button.mr-1(variant="outline-secondary", @click="$root.$emit('show::modal', 'filter-modal')")
        i.fa.fa-filter
        span.hidden-sm-down &nbsp;Filter
      b-button.mr-1(variant="outline-warning", @click="$root.$emit('show::modal', 'person-modal')")
        i.fa.fa-user
        span.hidden-sm-down &nbsp;Person
      b-button(variant="outline-primary", @click="reload()")
        i.fa.fa-refresh
        span.hidden-sm-down &nbsp;Reload
</template>

<script lang="ts" src="./navigation.component.ts"></script>
