<script setup>
import { computed, onMounted } from 'vue'
import { useCatalogStore } from '../stores/catalog'
import { usePageMeta } from '../composables/usePageMeta'
import ProductCard from '../components/ProductCard.vue'
import CatalogState from '../components/CatalogState.vue'
import CatalogImage from '../components/shared/CatalogImage.vue'
import ContactButton from '../components/shared/ContactButton.vue'
import DetailActions from '../components/shared/DetailActions.vue'
import SectionHeading from '../components/shared/SectionHeading.vue'
import NotFoundPage from './NotFoundPage.vue'
const props = defineProps({ slug: { type: String, required: true } })
const catalog = useCatalogStore()
const box = computed(() => catalog.boxBySlug(props.slug))
const products = computed(() => (box.value ? catalog.productsByBox(box.value.id) : []))
usePageMeta(() =>
  box.value
    ? {
        title: box.value.name,
        description: box.value.description,
        image: box.value.image,
      }
    : { title: 'Conheça um box' },
)
onMounted(() => catalog.loadCatalog())
</script>
<template>
  <q-page v-if="!catalog.loaded || catalog.error" class="page-container listing-page"
    ><CatalogState
      :loading="!catalog.error"
      :error="catalog.error"
      @retry="catalog.loadCatalog({ force: true })"
  /></q-page>
  <q-page v-else-if="box" class="page-container detail-page">
    <router-link to="/boxes" class="back-link"
      ><q-icon name="arrow_back" /> Explorar boxes</router-link
    >
    <section class="detail-grid">
      <figure class="detail-photo">
        <CatalogImage
          :src="box.image"
          :alt="`Imagem ilustrativa de ${box.categoryLabel.toLowerCase()}`"
          eager
        />
        <figcaption>Imagem ilustrativa · Expositor demonstrativo</figcaption>
      </figure>
      <div class="detail-copy">
        <div class="detail-category">
          <span>{{ box.categoryLabel }}</span
          ><span>{{ box.number }}</span>
        </div>
        <h1>{{ box.name }}</h1>
        <p class="detail-description">{{ box.description }}</p>
        <div class="maker-line">
          <q-icon name="person_outline" />
          <div>
            <small>Quem faz</small><strong>{{ box.owner }}</strong>
          </div>
        </div>
        <ContactButton :box="box" /><DetailActions type="box" :item="box" />
        <div class="visit-facts">
          <p>
            <q-icon name="schedule" /><span
              ><strong>Quando encontrar</strong>{{ box.hours }}</span
            >
          </p>
          <p>
            <q-icon name="place" /><span
              ><strong>Onde encontrar</strong>{{ box.location }}</span
            >
          </p>
        </div>
      </div>
    </section>
    <section class="maker-story">
      <h2>Uma história feita à mão.</h2>
      <p>{{ box.story }}</p>
    </section>
    <section class="section-space">
      <SectionHeading
        title="Um pouco do que você encontra aqui"
        description="Gostou de uma peça? Converse com o expositor para saber mais."
      />
      <div v-if="products.length" class="product-grid">
        <ProductCard v-for="product in products" :key="product.id" :product="product" />
      </div>
      <p v-else>
        O catálogo deste box está em preparação. Conheça a história e confirme as
        novidades com o expositor.
      </p>
    </section>
  </q-page>
  <NotFoundPage v-else />
</template>
<style scoped>
.detail-category {
  display: flex;
  gap: 12px;
  color: var(--blue);
  font-size: 0.75rem;
  font-weight: 600;
}
.detail-category span + span {
  color: var(--muted);
}
.maker-line {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-block: 26px;
}
.maker-line > .q-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  background: var(--blue-soft);
  color: var(--blue);
  border-radius: 50%;
  font-size: 1.5rem;
}
.maker-line div {
  display: grid;
  gap: 2px;
}
.maker-line small {
  font-size: 0.75rem;
  color: var(--muted);
}
.maker-line strong {
  font-size: 0.875rem;
}
.visit-facts {
  border-top: 1px solid var(--line);
  margin-top: 24px;
  padding-top: 8px;
}
.visit-facts p {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: var(--muted);
  font-size: 0.8125rem;
  margin: 18px 0 0;
}
.visit-facts .q-icon {
  font-size: 1.25rem;
  color: var(--blue);
}
.visit-facts span {
  display: grid;
  gap: 3px;
}
.visit-facts strong {
  color: var(--text);
  font-weight: 500;
}
.maker-story {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  padding: 40px;
  background: var(--soft);
  border-radius: 14px;
  margin-top: 52px;
}
.maker-story h2 {
  font-size: 2.25rem;
  font-weight: 500;
  margin: 0;
}
.maker-story p {
  color: var(--muted);
  font-size: 0.9375rem;
  line-height: 1.9;
  margin: 0;
}
@media (max-width: 760px) {
  .maker-story {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 26px;
  }
}
</style>
