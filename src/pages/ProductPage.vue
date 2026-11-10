<script setup>
import { computed, onMounted } from 'vue'
import { useCatalogStore } from '../stores/catalog'
import { usePageMeta } from '../composables/usePageMeta'
import { formatPrice } from '../utils/catalog'
import CatalogState from '../components/CatalogState.vue'
import CatalogImage from '../components/shared/CatalogImage.vue'
import ContactButton from '../components/shared/ContactButton.vue'
import DetailActions from '../components/shared/DetailActions.vue'
import NotFoundPage from './NotFoundPage.vue'
const props = defineProps({ slug: { type: String, required: true } })
const catalog = useCatalogStore()
const product = computed(() => catalog.productBySlug(props.slug))
const owner = computed(() => catalog.boxById(product.value?.boxId))
usePageMeta(() =>
  product.value
    ? {
        title: product.value.name,
        description: product.value.description,
        image: product.value.image,
      }
    : { title: 'Conheça um produto' },
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
  <q-page v-else-if="product && owner" class="page-container detail-page">
    <router-link class="back-link" to="/produtos"
      ><q-icon name="arrow_back" /> Descobrir produtos</router-link
    >
    <article class="detail-grid">
      <figure class="detail-photo">
        <CatalogImage
          :src="product.image"
          :alt="`Composição ilustrativa de produtos; ${product.name}`"
          eager
        />
        <figcaption>Imagem ilustrativa · Produto demonstrativo</figcaption>
      </figure>
      <div class="detail-copy">
        <router-link class="text-link" :to="`/boxes/${owner.slug}`"
          >{{ owner.name }} <q-icon name="north_east"
        /></router-link>
        <h1>{{ product.name }}</h1>
        <p class="detail-description">{{ product.description }}</p>
        <div class="detail-price">
          <strong>{{ formatPrice(product.price) }}</strong>
          <p>Valor demonstrativo. Confirme preço e disponibilidade com o expositor.</p>
        </div>
        <ContactButton :box="owner" :product-name="product.name" /><DetailActions
          type="product"
          :item="product"
        />
        <div class="direct-contact">
          <q-icon name="handshake" />
          <p>
            Você combina tudo diretamente com quem faz: disponibilidade, pagamento e
            retirada.
          </p>
        </div>
        <router-link class="owner-visit" :to="`/boxes/${owner.slug}`"
          ><q-icon name="storefront" /><span
            ><strong>Conheça {{ owner.name }}</strong
            ><small>{{ owner.number }} · {{ owner.location }}</small></span
          ><q-icon name="arrow_forward"
        /></router-link>
      </div>
    </article>
  </q-page>
  <NotFoundPage v-else />
</template>
<style scoped>
.detail-price {
  margin: 28px 0;
}
.detail-price > strong {
  font-size: 2rem;
  font-family: var(--font-display);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.detail-price p {
  max-width: 40ch;
  color: var(--muted);
  font-size: 0.75rem;
  margin-top: 6px;
}
.direct-contact {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.75rem;
}
.direct-contact > .q-icon {
  font-size: 1.375rem;
  color: var(--blue);
}
.direct-contact p {
  margin: 0;
  line-height: 1.7;
}
.owner-visit {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--soft);
  padding: 18px;
  border-radius: 12px;
  margin-top: 24px;
}
.owner-visit > .q-icon {
  color: var(--blue);
  font-size: 1.375rem;
}
.owner-visit > .q-icon:last-child {
  margin-left: auto;
}
.owner-visit span {
  display: grid;
  gap: 6px;
}
.owner-visit strong {
  font-size: 0.8125rem;
  font-weight: 600;
}
.owner-visit small {
  font-size: 0.75rem;
  color: var(--muted);
}
</style>
