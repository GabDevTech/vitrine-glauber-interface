<script setup>
import { computed, onMounted } from 'vue'
import { useCatalogStore } from '../stores/catalog'
import { usePageMeta } from '../composables/usePageMeta'
import HomeHero from '../components/HomeHero.vue'
import HomeStory from '../components/HomeStory.vue'
import HomeVisit from '../components/HomeVisit.vue'
import CategoryNavigation from '../components/home/CategoryNavigation.vue'
import SectionHeading from '../components/shared/SectionHeading.vue'
import BoxCard from '../components/BoxCard.vue'
import ProductCard from '../components/ProductCard.vue'
import CatalogState from '../components/CatalogState.vue'
const catalog = useCatalogStore()
const featuredProducts = computed(() =>
  [1, 5, 3, 8]
    .map((id) => catalog.products.find((item) => item.id === id))
    .filter(Boolean),
)
usePageMeta({
  description:
    'Descubra produtos, boxes e histórias do Centro Cultural Glauber Rocha. Conheça por aqui e viva de perto em Vitória da Conquista.',
})
onMounted(() => catalog.loadCatalog())
</script>
<template>
  <q-page>
    <HomeHero />
    <section class="page-container section-space category-section">
      <SectionHeading title="Encontre o que combina com você" /><CategoryNavigation
        :categories="catalog.categories"
      />
    </section>
    <section class="page-container section-space">
      <SectionHeading
        title="Gente que faz o Glauber"
        description="Conheça os espaços e as pessoas por trás de cada criação."
        to="/boxes"
        link-label="Explorar todos os boxes"
      /><CatalogState
        :loading="!catalog.loaded && !catalog.error"
        :error="catalog.error"
        @retry="catalog.loadCatalog({ force: true })"
        ><div class="box-grid">
          <BoxCard
            v-for="box in catalog.boxes.slice(0, 3)"
            :key="box.id"
            :box="box"
          /></div
      ></CatalogState>
    </section>
    <section class="page-container section-space products-section">
      <SectionHeading
        title="Pequenos achados, grandes histórias"
        description="Uma seleção para despertar a vontade de conhecer de perto."
        to="/produtos"
        link-label="Ver todos os produtos"
      /><CatalogState
        :loading="!catalog.loaded && !catalog.error"
        :error="catalog.error"
        @retry="catalog.loadCatalog({ force: true })"
        ><div class="product-grid">
          <ProductCard
            v-for="product in featuredProducts"
            :key="product.id"
            :product="product"
          />
        </div>
        <p class="catalog-note">
          Catálogo demonstrativo. Imagens ilustrativas; valores e disponibilidade sujeitos
          à confirmação.
        </p></CatalogState
      >
    </section>
    <HomeStory />
    <HomeVisit />
  </q-page>
</template>
