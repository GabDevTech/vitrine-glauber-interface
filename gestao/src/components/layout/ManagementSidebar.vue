<script setup>
import { computed } from 'vue'
import { navigation, publicSiteUrl } from '../../config/navigation'
import { useManagementSession } from '../../stores/session'
import ManagementBrand from './ManagementBrand.vue'

defineEmits(['navigate'])
const session = useManagementSession()
const visibleNavigation = computed(() => {
  const isAdmin = (session.user?.roles || []).includes('admin')
  return navigation.filter((item) => !item.adminOnly || isAdmin)
})
</script>
<template>
  <div class="management-sidebar">
    <ManagementBrand />
    <nav class="sidebar-navigation" aria-label="Navegação da gestão">
      <router-link
        v-for="item in visibleNavigation"
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
