<template lang="pug">
  mixin item(to, icon, label)
    b-nav-item(to=to)
      i.fa(class="fa-" + icon)
      span.hidden-xs-down &nbsp;#{label}

  b-navbar(toggleable, type="inverse", toggle-breakpoint="xl", variant="inverse", fixed="top")
    b-collapse(is-nav, id="nav-collapse")
      b-nav.mr-auto(is-nav-bar)
        +item("/timeline", "clock-o", "Timeline")
        +item("/notes", "files-o", "Notes")
        +item("/activity", "history", "Activity")
      b-button.mr-3(variant="outline-secondary", @click="$root.$emit('show::modal', 'filter-modal')")
        i.fa.fa-filter
        span.hidden-sm-down &nbsp;Filter
      b-button(variant="outline-primary", @click="reload()")
        i.fa.fa-refresh
        span.hidden-sm-down &nbsp;Reload
</template>

<script lang="ts" src="./navigation.component.ts"></script>
