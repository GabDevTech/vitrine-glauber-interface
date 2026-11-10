<script setup>
import { computed } from 'vue'
import { statuses } from '../../config/statuses'
import StatusBadge from '../shared/StatusBadge.vue'

const props = defineProps({ records: { type: Array, default: () => [] } })
const distribution = computed(() =>
  statuses.map((status) => ({
    ...status,
    count: props.records.filter((record) => record.status === status.value).length,
  })),
)
const published = computed(
  () => distribution.value.find((status) => status.value === 'publicado')?.count || 0,
)
const percentage = computed(() =>
  props.records.length ? Math.round((published.value / props.records.length) * 100) : 0,
)
</script>

<template>
  <section
    class="management-panel publication-overview"
    aria-labelledby="publication-title"
  >
    <header class="panel-heading">
      <div>
        <h2 id="publication-title">Situação do catálogo</h2>
        <p>{{ published }} de {{ records.length }} cadastros publicados.</p>
      </div>
    </header>
    <div class="publication-summary">
      <div
        class="publication-ring"
        :style="{ '--published-angle': `${percentage * 3.6}deg` }"
        aria-hidden="true"
      >
        <span>{{ percentage }}%</span>
      </div>
      <div>
        <strong>{{ published }} publicados</strong>
        <p>{{ records.length - published }} cadastros a preparar</p>
      </div>
    </div>
    <details class="publication-breakdown">
      <summary>Detalhar estados do catálogo</summary>
      <ul class="publication-states">
        <li v-for="status in distribution" :key="status.value">
          <div>
            <StatusBadge :value="status.value" /><strong>{{ status.count }}</strong>
          </div>
          <meter
            :value="status.count"
            min="0"
            :max="Math.max(records.length, 1)"
            :aria-label="status.label"
          >
            {{ status.count }} de {{ records.length }}
          </meter>
        </li>
      </ul>
    </details>
    <router-link to="/gestao/revisoes" class="management-text-link publication-link"
      >Acompanhar revisões <q-icon name="arrow_forward" aria-hidden="true"
    /></router-link>
  </section>
</template>
