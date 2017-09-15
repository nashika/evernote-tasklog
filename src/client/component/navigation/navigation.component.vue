<template lang="pug">
  mixin item(to, icon, label)
    b-nav-item(to=to)
      i.fa(class="fa-" + icon)
      | &nbsp;#{label}

  b-navbar.d-print-none(toggleable="sm", type="dark", variant="dark", fixed="top")
    b-nav-toggle(target="nav-collapse")
    b-collapse#nav-collapse(is-nav)
      b-nav.mr-auto(is-nav-bar)
        +item("/attendance", "vcard", "{{$t('common.attendance')}}")
        +item("/timeline", "clock-o", "{{$t('common.timeline')}}")
        +item("/notes", "files-o", "{{$tc('common.note')}}")
        +item("/activity", "history", "{{$t('common.activity')}}")
        +item("/repetition", "recycle", "{{$t('common.repetition')}}")
        +item("/constraint", "check-circle", "{{$t('common.constraint')}}")
    b-button(:variant="datastoreService.$vm.currentPersonId ? 'warning' : 'outline-warning'", @click="$root.$emit('show::modal', 'person-modal')")
      i.fa.fa-user
      span.d-none.d-sm-inline &nbsp;{{personLabel}}
</template>

<script lang="ts" src="./navigation.component.ts"></script>
