<script setup>
import FavoriteButton from './shared/FavoriteButton.vue'
import CatalogImage from './shared/CatalogImage.vue'
defineProps({ box: { type: Object, required: true } })
</script>
<template>
  <article class="box-card">
    <div class="card-media">
      <router-link :to="`/boxes/${box.slug}`" :aria-label="`Conhecer ${box.name}`"
        ><CatalogImage
          :src="box.image"
          :alt="`Imagem ilustrativa de ${box.categoryLabel.toLowerCase()}`"
      /></router-link>
      <span class="box-number">{{ box.number }}</span>
      <FavoriteButton type="box" :id="box.id" :name="box.name" />
    </div>
    <div class="box-card-body">
      <span class="category-label">{{ box.categoryLabel }}</span>
      <h3>
        <router-link :to="`/boxes/${box.slug}`">{{ box.name }}</router-link>
      </h3>
      <p>{{ box.description }}</p>
      <div class="box-card-bottom">
        <span><q-icon name="person_outline" /> {{ box.owner }}</span
        ><router-link :to="`/boxes/${box.slug}`" :aria-label="`Conhecer ${box.name}`"
          ><q-icon name="arrow_forward"
        /></router-link>
      </div>
    </div>
  </article>
</template>
<style scoped>
.box-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition:
    border-color var(--motion-ui),
    box-shadow var(--motion-ui);
}
.card-media {
  position: relative;
  background: var(--soft);
}
.card-media > a {
  display: block;
  overflow: hidden;
}
.card-media :deep(img) {
  width: 100%;
  aspect-ratio: 1.65;
  object-fit: cover;
  transition: transform 500ms var(--ease-out);
}
.card-media .favorite-button {
  position: absolute;
  right: 12px;
  top: 12px;
}
.box-number {
  position: absolute;
  bottom: 14px;
  left: 16px;
  padding: 6px 10px;
  border-radius: 6px;
  background: white;
  color: #142d59;
  font-size: 0.75rem;
  font-weight: 600;
}
.box-card-body {
  padding: 23px 24px 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.category-label {
  color: var(--blue);
  font-size: 0.75rem;
  font-weight: 600;
}
h3 {
  font-size: 1.5625rem;
  margin: 5px 0 10px;
  line-height: 1.2;
}
p {
  color: var(--muted);
  font-size: 0.875rem;
  line-height: 1.7;
  margin: 0 0 22px;
}
.box-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid var(--line);
  margin-top: auto;
  padding-top: 8px;
}
.box-card-bottom span {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 0.75rem;
}
.box-card-bottom a {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: var(--blue);
  font-size: 1.3125rem;
  transition: transform var(--motion-ui) var(--ease-out);
}
h3 a:hover {
  color: var(--blue);
}
.box-card:focus-within {
  border-color: var(--blue);
}
@media (hover: hover) and (pointer: fine) {
  .box-card:hover {
    box-shadow: var(--shadow-card);
    border-color: var(--blue);
  }
  .box-card:hover .card-media :deep(img) {
    transform: scale(1.035);
  }
  .box-card-bottom a:hover {
    transform: translateX(3px);
  }
}
</style>
