<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '../stores/catalog'
import { useFavoritesStore } from '../stores/favorites'
import { usePageMeta } from '../composables/usePageMeta'
import BoxCard from '../components/BoxCard.vue'
import ProductCard from '../components/ProductCard.vue'
import CatalogState from '../components/CatalogState.vue'
import SectionHeading from '../components/shared/SectionHeading.vue'
const catalog = useCatalogStore()
const favorites = useFavoritesStore()
const router = useRouter()
const boxes = computed(() =>
  catalog.boxes.filter((item) => favorites.has('box', item.id)),
)
const products = computed(() =>
  catalog.products.filter((item) => favorites.has('product', item.id)),
)
usePageMeta({
  title: 'Minha visita',
  description:
    'Guarde seus produtos e boxes favoritos para conhecer na próxima visita ao Glauber.',
})
onMounted(() => catalog.loadCatalog())
</script>
<template>
  <q-page class="page-container listing-page">
    <header class="page-intro">
      <h1>Sua visita começa com um achado.</h1>
      <p>
        Os boxes e produtos que você salvou ficam aqui, neste navegador. Sem cadastro, do
        seu jeito.
      </p>
    </header>
    <CatalogState
      :loading="!catalog.loaded && !catalog.error"
      :error="catalog.error"
      :empty="!boxes.length && !products.length"
      empty-title="O que você quer conhecer de perto?"
      empty-description="Toque no coração de um box ou produto para guardar seus favoritos aqui."
      empty-action="Explorar a vitrine"
      @retry="catalog.loadCatalog({ force: true })"
      @clear="router.push('/boxes')"
    >
      <section v-if="boxes.length" class="favorites-section">
        <SectionHeading title="Boxes para conhecer" />
        <div class="box-grid">
          <BoxCard v-for="box in boxes" :key="box.id" :box="box" />
        </div>
      </section>
      <section v-if="products.length" class="favorites-section">
        <SectionHeading title="Produtos que chamaram sua atenção" />
        <div class="product-grid">
          <ProductCard v-for="product in products" :key="product.id" :product="product" />
        </div>
      </section>
      <div class="visit-saved">
        <q-icon name="near_me" />
        <div>
          <h2>Vamos transformar a lista em passeio?</h2>
          <p>Confira como chegar e confirme o horário com cada expositor.</p>
        </div>
        <q-btn color="primary" unelevated no-caps label="Como chegar" to="/visite" />
      </div>
    </CatalogState>
  </q-page>
</template>
<style scoped>
.favorites-section {
  margin-bottom: 54px;
}
.visit-saved {
  display: flex;
  align-items: center;
  gap: 24px;
  background: var(--soft);
  padding: 28px;
  border-radius: 12px;
}
.visit-saved > .q-icon {
  font-size: 2.125rem;
  color: var(--blue);
}
h2 {
  font-size: 1.625rem;
  margin: 0 0 8px;
}
p {
  font-size: 0.8125rem;
  color: var(--muted);
  margin: 0;
}
.visit-saved .q-btn {
  margin-left: auto;
  flex: none;
}
@media (max-width: 760px) {
  .visit-saved {
    flex-direction: column;
    align-items: flex-start;
  }
  .visit-saved .q-btn {
    margin-left: 0;
  }
}
</style>
