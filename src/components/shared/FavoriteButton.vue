<script setup>
import { computed } from 'vue'
import { useFavoritesStore } from '../../stores/favorites'
const props = defineProps({
  type: { type: String, required: true },
  id: { type: Number, required: true },
  name: { type: String, required: true },
})
const favorites = useFavoritesStore()
const saved = computed(() => favorites.has(props.type, props.id))
</script>
<template>
  <q-btn
    class="favorite-button"
    :class="{ 'is-saved': saved }"
    flat
    round
    :icon="saved ? 'favorite' : 'favorite_border'"
    :aria-label="(saved ? 'Remover ' : 'Salvar ') + name"
    :aria-pressed="saved"
    @click="favorites.toggle(type, id)"
  />
</template>
<style scoped>
.favorite-button {
  background: var(--surface);
  color: var(--text);
  width: 44px;
  height: 44px;
  border: 1px solid var(--line);
  transition:
    background-color var(--motion-fast),
    color var(--motion-fast),
    border-color var(--motion-fast);
}
.favorite-button.is-saved {
  color: var(--blue);
  background: var(--blue-soft);
}
.favorite-button.is-saved :deep(.q-icon) {
  animation: favorite-confirm 280ms var(--ease-out);
}
</style>
