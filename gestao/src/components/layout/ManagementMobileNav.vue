<script setup>
import { computed } from 'vue'
import { navigation } from '../../config/navigation'
import { useManagementSession } from '../../stores/session'

const session = useManagementSession()
const visibleNavigation = computed(() => {
  const isAdmin = (session.user?.roles || []).includes('admin')
  return navigation.filter((item) => !item.adminOnly || isAdmin)
})
</script>
<template>
  <nav class="management-mobile-nav" aria-label="Atalhos da gestão">
    <router-link
      v-for="item in visibleNavigation"
      :key="item.to"
      :to="item.to"
      active-class="is-active"
      ><q-icon :name="item.icon" /><span>{{ item.shortLabel }}</span></router-link
    >
  </nav>
</template>
