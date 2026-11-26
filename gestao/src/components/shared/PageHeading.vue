<script setup>
defineProps({ title: String, description: String })
</script>
<template>
  <header class="management-page-heading">
    <div>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="heading-actions"><slot name="actions" /></div>
  </header>
</template>
