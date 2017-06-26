<template lang="pug">
  mixin item(to, icon, label)
    b-nav-item(to=to)
      span.fa(class="fa-" + icon)
      | #{label}

  b-navbar(toggleable, type="inverse", variant="inverse", fixed="top")
    b-nav-toggle(target="nav-collapse")
    b-button.mr-3(variant="outline-secondary") #[i.fa.fa-bars] Menu
    b-collapse(is-nav, id="nav-collapse")
      b-nav.mr-auto(is-nav-bar)
        +item("/", "th-large", "Menu")
        +item("/timeline", "clock-o", "Timeline")
        +item("/notes", "files-o", "Notes")
        +item("/activity", "history", "Activity")
      form.form-inline
        button.btn.btn-primary(type="button", @click="reload()") #[i.fa.fa-refresh] Reload
</template>

<script lang="ts" src="./navigation.component.ts"></script>
