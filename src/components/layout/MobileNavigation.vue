<script setup>
import { useRoute } from 'vue-router'
import { navigation } from '../../config/navigation'
const route = useRoute()
const active = (to) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
</script>

<template>
  <nav class="mobile-navigation" aria-label="Atalhos para celular">
    <router-link
      v-for="item in navigation"
      :key="item.to"
      :to="item.to"
      :aria-current="active(item.to) ? 'page' : undefined"
      ><q-icon :name="item.icon" /><span>{{
        item.label === 'Explorar boxes' ? 'Boxes' : item.label
      }}</span></router-link
    >
  </nav>
</template>

<style scoped>
.mobile-navigation {
  display: none;
}
@media (max-width: 760px) {
  .mobile-navigation {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    position: fixed;
    inset: auto 0 0;
    z-index: 1000;
    padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
    background: var(--surface);
    border-top: 1px solid var(--line);
    box-shadow: 0 -4px 24px rgb(20 45 89 / 5%);
  }
  a {
    display: flex;
    min-height: 48px;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 4px;
    color: var(--muted);
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 8px;
    transition:
      background-color var(--motion-ui),
      color var(--motion-ui);
  }
  a[aria-current] {
    color: var(--blue);
    background: var(--blue-soft);
  }
  .q-icon {
    font-size: 1.375rem;
  }
}
</style>
