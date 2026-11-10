<script setup>
import { computed, ref } from 'vue'
import RecordTable from '../catalog/RecordTable.vue'
import { filterRecords } from '../../utils/records'

const props = defineProps({
  records: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
})
defineEmits(['edit'])
const kind = ref('box')
const search = ref('')
const matches = computed(() =>
  filterRecords(
    props.records.map((record) => ({
      ...record,
      categoryLabel:
        props.categories.find((category) => category.id === record.category)?.label ||
        record.category,
      boxName:
        record.kind === 'product'
          ? props.records.find((box) => box.kind === 'box' && box.id === record.boxId)
              ?.name
          : undefined,
    })),
    { kind: kind.value, search: search.value },
  ),
)
const destination = computed(() => ({
  path: kind.value === 'box' ? '/gestao/boxes' : '/gestao/produtos',
  query: search.value ? { busca: search.value } : {},
}))
</script>

<template>
  <section
    class="management-panel catalog-overview"
    aria-labelledby="catalog-overview-title"
  >
    <header class="panel-heading">
      <div>
        <h2 id="catalog-overview-title">Catálogo da vitrine</h2>
        <p>Encontre um cadastro e atualize as informações.</p>
      </div>
      <router-link :to="destination" class="management-text-link"
        >Ver todos <q-icon name="arrow_forward" aria-hidden="true"
      /></router-link>
    </header>
    <div class="overview-tools">
      <div class="overview-switch" role="group" aria-label="Tipo de cadastro">
        <q-btn
          flat
          no-caps
          label="Boxes"
          :aria-pressed="kind === 'box'"
          :class="{ 'is-selected': kind === 'box' }"
          @click="kind = 'box'"
        />
        <q-btn
          flat
          no-caps
          label="Produtos"
          :aria-pressed="kind === 'product'"
          :class="{ 'is-selected': kind === 'product' }"
          @click="kind = 'product'"
        />
      </div>
      <q-input
        v-model="search"
        outlined
        dense
        clearable
        :label="kind === 'box' ? 'Buscar boxes' : 'Buscar produtos'"
        name="busca-resumo"
        autocomplete="off"
      >
        <template #prepend><q-icon name="search" aria-hidden="true" /></template>
      </q-input>
    </div>
    <RecordTable
      v-if="matches.length"
      :records="matches.slice(0, 5)"
      @edit="$emit('edit', $event)"
    />
    <div v-else class="management-state compact">
      <h3>Nenhum cadastro encontrado</h3>
      <p>Tente outro nome ou escolha outro tipo de cadastro.</p>
    </div>
    <p class="overview-count" role="status">
      {{ Math.min(matches.length, 5) }} de {{ matches.length }}
      {{ kind === 'box' ? 'boxes' : 'produtos' }}
    </p>
  </section>
</template>
