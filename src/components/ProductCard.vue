<script setup>
import { computed } from 'vue'
import { useCatalogStore } from '../stores/catalog'
import { formatPrice } from '../utils/catalog'
import FavoriteButton from './shared/FavoriteButton.vue'
import CatalogImage from './shared/CatalogImage.vue'
const props = defineProps({ product: { type: Object, required: true } })
const catalog = useCatalogStore()
const owner = computed(() => catalog.boxById(props.product.boxId))
</script>
<template>
  <article class="product-card">
    <div class="product-media">
      <router-link :to="`/produtos/${product.slug}`" :aria-label="`Ver ${product.name}`"
        ><CatalogImage
          :src="product.image"
          :alt="`Imagem ilustrativa de produtos artesanais; ${product.name}`"
      /></router-link>
      <FavoriteButton type="product" :id="product.id" :name="product.name" />
    </div>
    <div class="product-card-body">
      <router-link v-if="owner" class="product-owner" :to="`/boxes/${owner.slug}`">{{
        owner.name
      }}</router-link>
      <h3>
        <router-link :to="`/produtos/${product.slug}`">{{ product.name }}</router-link>
      </h3>
      <div class="product-card-bottom">
        <strong>{{ formatPrice(product.price) }}</strong
        ><router-link
          :to="`/produtos/${product.slug}`"
          :aria-label="`Detalhes de ${product.name}`"
          ><q-icon name="arrow_outward"
        /></router-link>
      </div>
    </div>
  </article>
</template>
<style scoped>
.product-card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 8px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  transition:
    border-color var(--motion-ui),
    box-shadow var(--motion-ui);
}
.product-media {
  position: relative;
  overflow: hidden;
  background: var(--soft);
  border-radius: var(--radius-image);
}
.product-media :deep(img) {
  width: 100%;
  aspect-ratio: 1.12;
  object-fit: cover;
  transition: transform 500ms var(--ease-out);
}
.favorite-button {
  position: absolute;
  top: 12px;
  right: 12px;
}
.product-card-body {
  padding: 17px 10px 4px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.product-owner {
  color: var(--muted);
  font-size: 0.75rem;
}
h3 {
  margin: 6px 0 4px;
  font-size: 1.3125rem;
  line-height: 1.3;
}
h3 a:hover {
  color: var(--blue);
}
.product-card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}
.product-card-bottom strong {
  font-size: 1rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.product-card-bottom a {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  font-size: 1.3125rem;
  color: var(--blue);
  transition: transform var(--motion-ui) var(--ease-out);
}
.product-card:focus-within {
  border-color: var(--blue);
}
@media (hover: hover) and (pointer: fine) {
  .product-card:hover {
    box-shadow: var(--shadow-card);
    border-color: var(--blue);
  }
  .product-card:hover .product-media :deep(img) {
    transform: scale(1.035);
  }
  .product-card-bottom a:hover {
    transform: translate(2px, -2px);
  }
}
@media (max-width: 760px) {
  .product-card-body {
    padding-inline: 4px;
  }
  h3 {
    font-size: 1.125rem;
  }
  .product-card-bottom strong {
    font-size: 0.875rem;
  }
}
</style>
