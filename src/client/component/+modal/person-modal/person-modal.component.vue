<template lang="pug">
  b-modal(id="person-modal", title="Person")
    b-table(striped, hover, :items="persons", :fields="fields")
      template(slot="action", scope="item")
        template(v-if="currentPersonId == item.item.id")
          b-button(block, variant="danger") Selected
        template(v-else)
          b-button(block, variant="secondary", @click="select(item.item.id)") Select
</template>

<script lang="ts" src="./person-modal.component.ts"></script>
