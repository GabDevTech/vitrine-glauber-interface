<script setup>
import { onMounted } from 'vue'
import { useCatalogFilters } from '../composables/useCatalogFilters'
import { usePageMeta } from '../composables/usePageMeta'
import ProductCard from '../components/ProductCard.vue'
import CatalogFilters from '../components/CatalogFilters.vue'
import CatalogState from '../components/CatalogState.vue'
const { catalog, query, category, sort, results, update, clear } =
  useCatalogFilters('products')
usePageMeta({
  title: 'Descubra os produtos',
  description:
    'Explore os produtos dos boxes e salve seus achados para a próxima visita.',
})
onMounted(() => catalog.loadCatalog())
</script>
<template>
  <q-page class="page-container listing-page">
    <header class="page-intro">
      <router-link class="back-link" to="/"
        ><q-icon name="arrow_back" /> Início</router-link
      >
      <h1>Achados com a cara de Conquista.</h1>
      <p>Explore, salve o que gostar e conheça de perto quem faz.</p>
    </header>
    <CatalogFilters
      :query="query"
      :category="category"
      :sort="sort"
      :categories="catalog.categories"
      :result-count="results.length"
      products
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
      ><div class="product-grid">
        <ProductCard
          v-for="product in results"
          :key="product.id"
          :product="product"
        /></div
    ></CatalogState>
    <p class="catalog-note">
      Catálogo demonstrativo. Imagens ilustrativas; valores e disponibilidade sujeitos à
      confirmação.
    </p>
  </q-page>
</template>
