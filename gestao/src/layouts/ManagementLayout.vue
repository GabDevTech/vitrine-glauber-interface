<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useManagementCatalog } from '../stores/catalog'
import { useManagementSession } from '../stores/session'
import ManagementSidebar from '../components/layout/ManagementSidebar.vue'
import ManagementTopbar from '../components/layout/ManagementTopbar.vue'
import ManagementMobileNav from '../components/layout/ManagementMobileNav.vue'
const drawerOpen = ref(false)
const catalog = useManagementCatalog()
const session = useManagementSession()
const route = useRoute()
const router = useRouter()
const quasar = useQuasar()
onMounted(() => catalog.load())
function closeMobileMenu() {
  if (quasar.screen.width < 1024) drawerOpen.value = false
}
watch(() => route.path, closeMobileMenu)
function logout() {
  session.leave()
  router.replace('/gestao/login')
}
</script>
<template>
  <q-layout view="hHh Lpr lFf" class="management-shell">
    <a class="skip-link" href="#management-content">Pular para o conteúdo</a>
    <ManagementTopbar
      :menu-open="drawerOpen"
      @menu="drawerOpen = !drawerOpen"
      @logout="logout"
    />
    <q-drawer
      id="management-navigation"
      v-model="drawerOpen"
      show-if-above
      :breakpoint="1023"
      :width="248"
      bordered
      class="management-drawer"
      ><ManagementSidebar @navigate="closeMobileMenu"
    /></q-drawer>
    <q-page-container>
      <main id="management-content" tabindex="-1">
        <router-view v-slot="{ Component, route: current }"
          ><Transition name="management-route" mode="out-in"
            ><div :key="current.path"><component :is="Component" /></div></Transition
        ></router-view>
        <p class="management-session-note">
          Ambiente de demonstração. Cadastros e fotos ficam salvos neste navegador e não
          alteram a vitrine pública.
        </p>
      </main>
    </q-page-container>
    <ManagementMobileNav />
  </q-layout>
</template>
