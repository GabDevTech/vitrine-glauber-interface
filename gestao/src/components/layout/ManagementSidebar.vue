<script setup>
import { navigation, publicSiteUrl } from '../../config/navigation'
import ManagementBrand from './ManagementBrand.vue'
defineEmits(['navigate'])
</script>
<template>
  <div class="management-sidebar">
    <ManagementBrand />
    <nav class="sidebar-navigation" aria-label="Navegação da gestão">
      <router-link
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        active-class="is-active"
        @click="$emit('navigate')"
        ><q-icon :name="item.icon" /><span>{{ item.label }}</span></router-link
      >
    </nav>
    <div class="sidebar-footer">
      <a :href="publicSiteUrl" target="_blank" rel="noopener noreferrer"
        ><q-icon name="open_in_new" /> Ver vitrine pública</a
      >
    </div>
  </div>
</template>
