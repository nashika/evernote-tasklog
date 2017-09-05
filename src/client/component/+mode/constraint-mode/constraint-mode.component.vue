<template lang="pug">
  section#constraint-mode.p-3
    b-table(bordered, striped, hover, small, responsive, head-variant="inverse", foot-clone, foot-variant="default",
    :fields="fields", :items="records")
</template>

<script lang="ts" src="./constraint-mode.component.ts"></script>
