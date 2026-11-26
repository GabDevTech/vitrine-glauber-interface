<script setup>
defineProps({
  loading: Boolean,
  error: { type: String, default: '' },
  empty: Boolean,
  emptyTitle: { type: String, default: 'Não encontramos esse achado' },
  emptyDescription: {
    type: String,
    default: 'Tente outro nome ou escolha uma categoria diferente.',
  },
  emptyAction: { type: String, default: 'Limpar filtros' },
})
defineEmits(['retry', 'clear'])
</script>
<template>
  <div
    v-if="loading"
    class="box-grid"
    role="status"
    aria-label="Carregando catálogo…"
    aria-busy="true"
  >
    <div v-for="n in 3" :key="n" class="skeleton-card">
      <q-skeleton height="220px" /><q-skeleton type="text" width="65%" /><q-skeleton
        type="text"
      />
    </div>
  </div>
  <div v-else-if="error" class="state-panel" role="alert">
    <q-icon name="cloud_off" />
    <h2>Vamos tentar de novo?</h2>
    <p>{{ error }}</p>
    <q-btn
      color="primary"
      unelevated
      no-caps
      icon="refresh"
      label="Carregar catálogo"
      @click="$emit('retry')"
    />
  </div>
  <div v-else-if="empty" class="state-panel">
    <q-icon name="search_off" />
    <h2>{{ emptyTitle }}</h2>
    <p>{{ emptyDescription }}</p>
    <q-btn
      color="primary"
      unelevated
      no-caps
      :label="emptyAction"
      @click="$emit('clear')"
    />
  </div>
  <slot v-else />
</template>
<style scoped>
.skeleton-card {
  display: grid;
  gap: 14px;
}
.state-panel {
  padding: 60px 24px;
  border: 1px dashed var(--line);
  border-radius: 14px;
  text-align: center;
  background: var(--soft);
}
.state-panel > .q-icon {
  font-size: 2rem;
  color: var(--blue);
  display: inline-grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--blue-soft);
}
h2 {
  font-size: 1.875rem;
  margin: 16px 0 10px;
}
p {
  color: var(--muted);
  margin: 0 0 24px;
}
</style>
