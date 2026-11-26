<script setup>
import { onMounted } from 'vue'
import { useCatalogFilters } from '../composables/useCatalogFilters'
import { usePageMeta } from '../composables/usePageMeta'
import BoxCard from '../components/BoxCard.vue'
import CatalogFilters from '../components/CatalogFilters.vue'
import CatalogState from '../components/CatalogState.vue'
const { catalog, query, category, sort, results, update, clear } =
  useCatalogFilters('boxes')
usePageMeta({
  title: 'Explore os boxes',
  description:
    'Encontre artesanato, sabores, moda e bem-estar. Conheça quem faz o Glauber acontecer.',
})
onMounted(() => catalog.loadCatalog())
</script>
<template>
  <q-page class="page-container listing-page">
    <header class="page-intro">
      <router-link class="back-link" to="/"
        ><q-icon name="arrow_back" /> Início</router-link
      >
      <h1>Encontre seu próximo favorito.</h1>
      <p>Por trás de cada box, uma pessoa e uma história para conhecer.</p>
    </header>
    <CatalogFilters
      :query="query"
      :category="category"
      :sort="sort"
      :categories="catalog.categories"
      :result-count="results.length"
      @update:query="update('busca', $event)"
      @update:category="update('categoria', $event)"
      @update:sort="update('ordem', $event)"
      @clear="clear"
    />
    <CatalogState
      :loading="!catalog.loaded && !catalog.error"
      :error="catalog.error"
      :empty="!results.length"
      @retry="catalog.loadCatalog({ force: true })"
      @clear="clear"
      ><div class="box-grid">
        <BoxCard v-for="box in results" :key="box.id" :box="box" /></div
    ></CatalogState>
    <p class="catalog-note">
      Expositores e informações demonstrativos. Fotografias ilustrativas.
    </p>
  </q-page>
</template>
