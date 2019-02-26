<template lang="pug">
  b-modal(id="person-modal", title="Person", ok-only, @shown="shown()", @hidden="hidden()")
    b-table(striped, hover, :items="persons", :fields="fields")
      template(slot="action", slot-scope="item")
        template(v-if="currentPersonId == item.item.id")
          b-button(block, variant="danger") Selected
        template(v-else)
          b-button(block, variant="secondary", @click="select(item.item.id)") Select
    .my-3(v-if="currentPersonId")
      b-button(block, variant="secondary", @click="select(0)") Unselect Person
</template>

<script lang="ts" src="./person-modal.component.ts"></script>
