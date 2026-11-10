<script setup>
import { navigation } from '../../config/navigation'
</script>
<template>
  <nav class="management-mobile-nav" aria-label="Atalhos da gestão">
    <router-link
      v-for="item in navigation"
      :key="item.to"
      :to="item.to"
      active-class="is-active"
      ><q-icon :name="item.icon" /><span>{{ item.shortLabel }}</span></router-link
    >
  </nav>
</template>
