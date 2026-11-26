<script setup>
defineProps({
  loading: Boolean,
  error: String,
  empty: Boolean,
  title: { type: String, default: 'Nenhum cadastro encontrado' },
  description: { type: String, default: 'Tente outro nome ou remova os filtros.' },
  clearable: Boolean,
})
defineEmits(['retry', 'clear'])
</script>
<template>
  <div
    v-if="loading"
    class="management-loading"
    role="status"
    aria-label="Carregando cadastros…"
    aria-busy="true"
  >
    <q-skeleton v-for="n in 3" :key="n" height="80px" />
  </div>
  <section v-else-if="error" class="management-state" role="alert">
    <q-icon name="cloud_off" />
    <h2>Os cadastros não carregaram</h2>
    <p>{{ error }}</p>
    <q-btn
      color="primary"
      no-caps
      unelevated
      label="Tentar novamente"
      @click="$emit('retry')"
    />
  </section>
  <section v-else-if="empty" class="management-state">
    <q-icon name="inventory_2" />
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <q-btn
      v-if="clearable"
      outline
      color="primary"
      no-caps
      label="Limpar filtros"
      @click="$emit('clear')"
    />
  </section>
  <slot v-else />
</template>
