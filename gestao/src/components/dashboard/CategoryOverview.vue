<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  records: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
})
const kind = ref('product')
const rows = computed(() =>
  props.categories.map((category) => {
    const items = props.records.filter(
      (record) => record.kind === kind.value && record.category === category.id,
    )
    return {
      ...category,
      total: items.length,
      published: items.filter((record) => record.status === 'publicado').length,
    }
  }),
)
const maximum = computed(() => Math.max(1, ...rows.value.map((row) => row.total)))
const total = computed(() => rows.value.reduce((sum, row) => sum + row.total, 0))
</script>

<template>
  <section
    class="management-panel category-overview"
    aria-labelledby="category-overview-title"
  >
    <header class="panel-heading">
      <div>
        <h2 id="category-overview-title">A vitrine por categoria</h2>
        <p>Veja o que já está publicado e o que falta preparar.</p>
      </div>
      <q-select
        v-model="kind"
        :options="[
          { label: 'Produtos', value: 'product' },
          { label: 'Boxes', value: 'box' },
        ]"
        emit-value
        map-options
        outlined
        dense
        options-dense
        label="Exibir no gráfico"
      />
    </header>
    <div class="category-chart-summary">
      <span
        ><b>{{ total }}</b>
        {{ kind === 'product' ? 'produtos no catálogo' : 'boxes no catálogo' }}</span
      >
      <div class="chart-legend">
        <span><i class="legend-published" />Publicados</span
        ><span><i class="legend-pending" />A preparar</span>
      </div>
    </div>
    <ul
      v-if="total"
      class="category-chart"
      aria-label="Cadastros publicados e a preparar por categoria"
    >
      <li v-for="row in rows" :key="row.id">
        <div class="category-chart-label">
          <span>{{ row.label }}</span
          ><span
            >{{ row.published }} {{ row.published === 1 ? 'publicado' : 'publicados' }} de
            {{ row.total }}</span
          >
        </div>
        <div class="category-chart-track" aria-hidden="true">
          <span
            class="category-bar-published"
            :style="{ width: `${(row.published / maximum) * 100}%` }"
          />
          <span
            class="category-bar-pending"
            :style="{ width: `${((row.total - row.published) / maximum) * 100}%` }"
          />
        </div>
      </li>
    </ul>
    <p v-else class="management-state compact">
      Adicione um cadastro para acompanhar as categorias.
    </p>
  </section>
</template>
