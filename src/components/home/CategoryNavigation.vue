<script setup>
defineProps({ categories: { type: Array, default: () => [] } })
</script>
<template>
  <nav class="category-grid" aria-label="Explore por categoria">
    <router-link
      v-for="category in categories.filter((item) => item.id !== 'todos')"
      :key="category.id"
      :to="{ path: '/boxes', query: { categoria: category.id } }"
      class="category-tile"
      :class="`tone-${category.tone}`"
    >
      <span class="category-icon"><q-icon :name="category.icon" /></span
      ><span class="category-copy"
        ><strong>{{ category.label }}</strong
        ><small>{{ category.description }}</small></span
      ><q-icon class="category-arrow" name="north_east" />
    </router-link>
  </nav>
</template>
<style scoped>
.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.category-tile {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 23px 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-image);
  transition:
    border-color var(--motion-ui),
    background-color var(--motion-ui);
}
.category-tile:hover {
  border-color: var(--blue);
}
.category-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex: none;
  border-radius: 12px;
  background: var(--blue-soft);
  color: var(--blue);
  font-size: 1.5625rem;
}
.tone-yellow .category-icon {
  background: #fff1bb;
  color: #755500;
}
.tone-pink .category-icon {
  background: #fce1ef;
  color: #9d225d;
}
.tone-green .category-icon {
  background: #dcf0e6;
  color: #246a4e;
}
.category-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}
.category-copy strong {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.125rem;
  line-height: 1.2;
}
.category-copy small {
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1.5;
}
.category-arrow {
  margin-left: auto;
  flex: none;
  font-size: 1rem;
  transition: transform var(--motion-ui) var(--ease-out);
}
@media (hover: hover) and (pointer: fine) {
  .category-tile:hover {
    background: var(--blue-soft);
  }
  .category-tile:hover .category-arrow {
    transform: translate(2px, -2px);
  }
}
@media (max-width: 1100px) {
  .category-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 440px) {
  .category-tile {
    padding: 17px 12px;
    gap: 9px;
  }
  .category-icon {
    width: 33px;
    height: 33px;
    font-size: 1.3125rem;
  }
  .category-copy strong {
    font-size: 0.9375rem;
  }
  .category-copy small,
  .category-arrow {
    display: none;
  }
}
</style>
