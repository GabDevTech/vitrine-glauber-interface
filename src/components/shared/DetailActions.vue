<script setup>
import { useShare } from '../../composables/useShare'
import FavoriteButton from './FavoriteButton.vue'
const props = defineProps({ type: String, item: Object })
const { share } = useShare()
</script>
<template>
  <div class="detail-secondary-actions">
    <FavoriteButton :type="type" :id="item.id" :name="item.name" /><span
      >Guardar na minha visita</span
    ><q-btn
      flat
      round
      icon="share"
      aria-label="Compartilhar página"
      @click="share({ title: props.item.name, text: props.item.description })"
    />
  </div>
</template>
<style scoped>
.detail-secondary-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  color: var(--muted);
  font-size: 0.75rem;
}
.detail-secondary-actions > .q-btn:last-child {
  margin-left: auto;
}
</style>
