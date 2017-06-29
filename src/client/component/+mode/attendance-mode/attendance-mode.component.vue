<template lang="pug">
  section#attendance-mode
    .container
      h1 {{person ? person.name : '未設定'}}'s attendance
      b-table(bordered, small, striped, hover, :fields="fields", :items="attendances")
</template>

<script lang="ts" src="./attendance-mode.component.ts"></script>
