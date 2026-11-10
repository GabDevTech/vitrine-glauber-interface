<script setup>
import StatusBadge from '../shared/StatusBadge.vue'
defineProps({ records: { type: Array, default: () => [] } })
defineEmits(['edit', 'publish'])
</script>
<template>
  <section class="management-panel">
    <header class="panel-heading">
      <div>
        <h2>O que precisa de atenção</h2>
        <p>Confira as revisões e prepare os próximos cadastros.</p>
      </div>
      <router-link to="/gestao/revisoes" class="management-text-link"
        >Ver fila completa <q-icon name="arrow_forward"
      /></router-link>
    </header>
    <ul v-if="records.length" class="review-queue">
      <li v-for="item in records.slice(0, 5)" :key="`${item.kind}:${item.id}`">
        <span class="queue-icon"
          ><q-icon :name="item.kind === 'box' ? 'storefront' : 'shopping_bag'"
        /></span>
        <div class="queue-copy">
          <h3>{{ item.name }}</h3>
          <p>{{ item.kind === 'box' ? 'Box' : 'Produto' }}</p>
        </div>
        <StatusBadge :value="item.status" /><q-btn
          flat
          no-caps
          color="primary"
          :label="item.status === 'pronto' ? 'Publicar' : 'Revisar'"
          :aria-label="`${item.status === 'pronto' ? 'Publicar' : 'Revisar'} ${item.name}${item.status === 'pronto' ? ' na demonstração' : ''}`"
          @click="item.status === 'pronto' ? $emit('publish', item) : $emit('edit', item)"
        />
      </li>
    </ul>
    <div v-else class="management-state compact">
      <q-icon name="task_alt" />
      <h3>Fila em dia</h3>
      <p>Não há rascunhos ou revisões nesta demonstração.</p>
    </div>
  </section>
</template>
