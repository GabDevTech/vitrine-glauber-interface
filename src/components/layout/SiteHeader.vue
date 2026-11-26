<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFavoritesStore } from '../../stores/favorites'
import BrandLogo from './BrandLogo.vue'
const emit = defineEmits(['accessibility'])
const route = useRoute()
const favorites = useFavoritesStore()
const menuOpen = ref(false)
const menuButton = ref(null)
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)
function closeMenu() {
  menuOpen.value = false
  menuButton.value?.$el.focus()
}
const links = [
  { label: 'Início', to: '/' },
  { label: 'Explorar boxes', to: '/boxes' },
  { label: 'Produtos', to: '/produtos' },
  { label: 'Sobre o projeto', to: '/sobre' },
]
const active = (to) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
</script>

<template>
  <q-header class="site-header">
    <q-toolbar class="page-container site-toolbar">
      <router-link to="/" class="brand-link" aria-label="Vitrine Glauber — início"
        ><BrandLogo
      /></router-link>
      <nav class="desktop-nav" aria-label="Navegação principal">
        <router-link
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :aria-current="active(link.to) ? 'page' : undefined"
          >{{ link.label }}</router-link
        >
      </nav>
      <div class="header-actions">
        <q-btn
          flat
          round
          icon="accessibility_new"
          aria-label="Opções de acessibilidade"
          @click="emit('accessibility')"
        />
        <q-btn
          flat
          round
          :icon="favorites.count ? 'favorite' : 'favorite_border'"
          to="/favoritos"
          aria-label="Minha visita"
        >
          <q-badge v-if="favorites.count" color="primary" floating rounded>{{
            favorites.count
          }}</q-badge>
        </q-btn>
        <q-btn
          class="visit-header desktop-only"
          color="primary"
          unelevated
          no-caps
          icon="near_me"
          label="Planejar visita"
          to="/visite"
        />
        <q-btn
          ref="menuButton"
          class="mobile-menu"
          flat
          round
          icon="menu"
          aria-label="Abrir menu"
          :aria-expanded="menuOpen"
          aria-controls="mobile-site-menu"
          @click="menuOpen = !menuOpen"
        />
      </div>
    </q-toolbar>
    <Transition name="menu">
      <nav
        v-if="menuOpen"
        id="mobile-site-menu"
        class="mobile-menu-panel"
        aria-label="Menu do site"
        @keydown.esc="closeMenu"
      >
        <router-link
          v-for="link in [...links, { label: 'Como chegar', to: '/visite' }]"
          :key="link.to"
          :to="link.to"
          @click="menuOpen = false"
          >{{ link.label }}<q-icon name="arrow_forward"
        /></router-link>
      </nav>
    </Transition>
  </q-header>
</template>

<style scoped>
.site-header {
  background: var(--surface);
  color: var(--text);
  border-bottom: 1px solid var(--line);
}
.site-toolbar {
  min-height: 76px;
  padding: 0;
  display: flex;
  gap: 30px;
}
.brand-link {
  display: inline-flex;
  flex: none;
  padding: 8px 0;
}
.desktop-nav {
  display: flex;
  justify-content: center;
  flex: 1;
  gap: 28px;
}
.desktop-nav a {
  min-height: 44px;
  display: flex;
  align-items: center;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--muted);
  position: relative;
  transition: color var(--motion-fast);
}
.desktop-nav a::after {
  content: '';
  position: absolute;
  height: 2px;
  inset: auto 0 0;
  background: var(--blue);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--motion-ui) var(--ease-out);
}
.desktop-nav a:hover,
.desktop-nav a[aria-current] {
  color: var(--blue);
}
.desktop-nav a:hover::after,
.desktop-nav a[aria-current]::after {
  transform: scaleX(1);
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 3px;
}
.visit-header {
  margin-left: 12px;
}
.mobile-menu {
  display: none;
}
.mobile-menu-panel {
  display: grid;
  padding: 12px 24px 22px;
  position: absolute;
  top: calc(100% + 8px);
  left: 20px;
  right: 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-overlay);
  max-height: 70dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
  transform-origin: top right;
}
.mobile-menu-panel a {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
}
@media (min-width: 761px) {
  .mobile-menu-panel {
    display: none;
  }
}
@media (max-width: 1050px) {
  .desktop-nav {
    gap: 18px;
  }
  .site-toolbar {
    gap: 16px;
  }
  .visit-header {
    display: none;
  }
}
@media (max-width: 760px) {
  .desktop-nav {
    display: none;
  }
  .site-toolbar {
    min-height: 72px;
    justify-content: space-between;
  }
  .mobile-menu {
    display: inline-flex;
  }
}
</style>
