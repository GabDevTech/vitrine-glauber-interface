<script setup>
import { computed } from 'vue'
const props = defineProps({
  query: { type: String, default: '' },
  category: { type: String, default: 'todos' },
  sort: { type: String, default: 'destaques' },
  categories: { type: Array, default: () => [] },
  resultCount: Number,
  products: Boolean,
})
defineEmits(['update:query', 'update:category', 'update:sort', 'clear'])
const hasFilters = computed(() => Boolean(props.query) || props.category !== 'todos')
const sortOptions = computed(() => [
  { label: 'Em destaque', value: 'destaques' },
  { label: 'Nome: A a Z', value: 'nome' },
  ...(props.products
    ? [
        { label: 'Menor preço', value: 'menor-preco' },
        { label: 'Maior preço', value: 'maior-preco' },
      ]
    : []),
])
</script>
<template>
  <div class="catalog-filters">
    <q-input
      :model-value="query"
      name="busca"
      autocomplete="off"
      outlined
      clearable
      label="Buscar por nome, produto ou expositor"
      placeholder="Ex.: cerâmica…"
      debounce="180"
      @update:model-value="$emit('update:query', $event || '')"
      ><template #prepend><q-icon name="search" /></template
    ></q-input>
    <div class="filter-categories" role="group" aria-label="Filtrar por categoria">
      <q-btn
        v-for="item in categories"
        :key="item.id"
        :model-value="category === item.id"
        :outline="category !== item.id"
        :unelevated="category === item.id"
        :color="category === item.id ? 'primary' : undefined"
        no-caps
        :icon="item.icon"
        :label="item.label"
        :aria-pressed="category === item.id"
        @click="$emit('update:category', item.id)"
      />
    </div>
    <div class="filter-results">
      <div class="filter-count" role="status">
        {{ resultCount }}
        {{
          products
            ? resultCount === 1
              ? 'produto encontrado'
              : 'produtos encontrados'
            : resultCount === 1
              ? 'box encontrado'
              : 'boxes encontrados'
        }}<q-btn
          v-if="hasFilters"
          flat
          no-caps
          label="Limpar filtros"
          icon="close"
          @click="$emit('clear')"
        />
      </div>
      <q-select
        :model-value="sort"
        :options="sortOptions"
        emit-value
        map-options
        outlined
        dense
        label="Ordenar por"
        @update:model-value="$emit('update:sort', $event)"
      />
    </div>
  </div>
</template>
<style scoped>
.catalog-filters {
  display: grid;
  gap: 22px;
  margin-bottom: 30px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}
.filter-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.filter-categories .q-btn {
  border-radius: 24px;
  font-size: 0.75rem;
}
.filter-results {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding-top: 8px;
  border-top: 1px solid var(--line);
}
.filter-count {
  font-size: 0.8125rem;
  color: var(--muted);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.filter-count .q-btn {
  font-size: 0.75rem;
  color: var(--blue);
}
.q-select {
  width: 190px;
  flex: none;
}
@media (max-width: 600px) {
  .catalog-filters {
    padding: 18px 14px;
  }
  .filter-results {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .q-select {
    width: 100%;
  }
  .filter-categories {
    gap: 8px;
  }
  .filter-categories .q-btn {
    padding-inline: 12px;
  }
}
</style>
