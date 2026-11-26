<script setup>
defineProps({ title: String, description: String, to: String, linkLabel: String })
</script>
<template>
  <div class="section-heading">
    <div>
      <h2>{{ title }}</h2>
      <p v-if="description">{{ description }}</p>
    </div>
    <router-link v-if="to" :to="to" class="text-link"
      >{{ linkLabel }} <q-icon name="arrow_forward"
    /></router-link>
  </div>
</template>
