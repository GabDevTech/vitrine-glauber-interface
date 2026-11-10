<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ManagementBrand from './ManagementBrand.vue'
import { useManagementTheme } from '../../stores/theme'
defineProps({ menuOpen: Boolean })
defineEmits(['menu', 'logout'])
const theme = useManagementTheme()
const router = useRouter()
const search = ref('')
function findProducts() {
  router.push({
    path: '/gestao/produtos',
    query: search.value.trim() ? { busca: search.value.trim() } : {},
  })
}
</script>
<template>
  <q-header class="management-header">
    <q-toolbar class="management-toolbar">
      <q-btn
        class="mobile-menu-trigger"
        flat
        round
        icon="menu"
        aria-label="Abrir navegação da gestão"
        aria-controls="management-navigation"
        :aria-expanded="menuOpen"
        @click="$emit('menu')"
      />
      <ManagementBrand class="toolbar-brand" />
      <form class="toolbar-search" role="search" @submit.prevent="findProducts">
        <q-input
          v-model="search"
          dense
          borderless
          label="Encontrar produtos"
          name="busca-topo"
          autocomplete="off"
        >
          <template #prepend><q-icon name="search" aria-hidden="true" /></template>
          <template #append
            ><q-btn
              flat
              round
              dense
              type="button"
              @click="findProducts"
              icon="arrow_forward"
              aria-label="Buscar no catálogo de produtos"
          /></template>
        </q-input>
      </form>
      <span class="demo-label"
        ><span aria-hidden="true"></span>Ambiente de demonstração</span
      >
      <q-space />
      <span class="toolbar-profile"
        ><span class="profile-avatar" aria-hidden="true">VG</span
        ><span>Equipe Vitrine<small>Gestão do catálogo</small></span></span
      >
      <q-btn
        flat
        round
        :icon="theme.isDark ? 'light_mode' : 'dark_mode'"
        :aria-label="theme.isDark ? 'Ativar tema claro' : 'Ativar tema escuro'"
        @click="theme.toggle"
      />
      <q-btn
        class="management-logout"
        flat
        no-caps
        icon="logout"
        :label="$q.screen.width <= 700 ? undefined : 'Sair'"
        aria-label="Sair da demonstração"
        @click="$emit('logout')"
      />
    </q-toolbar>
  </q-header>
</template>
