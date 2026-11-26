<script setup>
import { ref } from 'vue'
import SiteHeader from '../components/layout/SiteHeader.vue'
import SiteFooter from '../components/layout/SiteFooter.vue'
import MobileNavigation from '../components/layout/MobileNavigation.vue'
import AccessibilityPanel from '../components/layout/AccessibilityPanel.vue'
const accessibilityOpen = ref(false)
</script>

<template>
  <q-layout view="hHh lpR fff">
    <a class="skip-link" href="#conteudo-principal">Pular para o conteúdo</a>
    <SiteHeader @accessibility="accessibilityOpen = true" />
    <q-page-container>
      <main id="conteudo-principal" tabindex="-1">
        <router-view v-slot="{ Component, route }">
          <!-- A chave usa o caminho, para filtros não dispararem animações de página. -->
          <Transition name="route" mode="out-in">
            <div :key="route.path" class="route-surface">
              <component :is="Component" />
            </div>
          </Transition>
        </router-view>
      </main>
      <SiteFooter />
    </q-page-container>
    <MobileNavigation />
    <AccessibilityPanel v-model="accessibilityOpen" />
  </q-layout>
</template>
