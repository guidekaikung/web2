<script setup>
const props = defineProps({
  name: {
    type: String,
    required: true,
  },

  path: {
    type: String,
    default: '',
  },

  icon: {
    type: String,
    default: '#',
  },

  children: {
    type: Array,
    default: null,
  },
});
</script>

<template>
  <q-item v-if="!children" :to="path" clickable exact active-class="my-menu-link">
    <q-item-section avatar>
      <q-icon :name="icon" />
    </q-item-section>
    <q-item-section>{{ name }}</q-item-section>
  </q-item>
  <q-expansion-item v-else expand-separator :icon="icon" :label="name">
    <q-item
      v-for="item in children"
      :key="item"
      :to="`${path}${item.path}`"
      clickable
      exact
      active-class="my-menu-link"
    >
      <q-item-section avatar />
      <q-item-section>{{ item.name }}</q-item-section>
    </q-item>
  </q-expansion-item>
</template>

<style lang="scss">
.my-menu-link {
  color: #6f418f;
  background: #e1daef;
}
</style>
