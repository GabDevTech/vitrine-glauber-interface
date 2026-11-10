<script setup>
import { statuses } from '../../config/statuses'
import { ref } from 'vue'
const filtersOpen = ref(false)
defineProps({
  search: String,
  status: String,
  category: String,
  categories: Array,
  count: Number,
  label: String,
  review: Boolean,
  boxId: String,
  boxes: { type: Array, default: () => [] },
  showBox: Boolean,
})
defineEmits(['search', 'status', 'category', 'box', 'clear'])
</script>
<template>
  <div class="record-filters" :class="{ 'has-box-filter': showBox }">
    <div class="filter-controls">
      <q-input
        :model-value="search"
        outlined
        clearable
        :label="`Buscar ${label.toLowerCase()}`"
        name="busca"
        autocomplete="off"
        :debounce="150"
        @update:model-value="$emit('search', $event || '')"
        ><template #prepend><q-icon name="search" /></template
      ></q-input>
      <q-btn
        class="filter-toggle"
        outline
        no-caps
        color="primary"
        icon="tune"
        :label="`Filtros${status || category || boxId ? ' ativos' : ''}`"
        :aria-expanded="filtersOpen"
        aria-controls="record-extra-filters"
        @click="filtersOpen = !filtersOpen"
      />
      <div
        id="record-extra-filters"
        class="filter-extra"
        :class="{ 'is-expanded': filtersOpen }"
      >
        <q-select
          :model-value="status || null"
          outlined
          clearable
          emit-value
          map-options
          label="Status"
          :options="
            review ? statuses.filter((item) => item.value !== 'publicado') : statuses
          "
          @update:model-value="$emit('status', $event)"
        />
        <q-select
          v-if="showBox"
          :model-value="boxId ? Number(boxId) : null"
          outlined
          clearable
          emit-value
          map-options
          label="Box"
          :options="boxes.map((item) => ({ label: item.name, value: item.id }))"
          @update:model-value="$emit('box', $event)"
        />
        <q-select
          :model-value="category || null"
          outlined
          clearable
          emit-value
          map-options
          label="Categoria"
          :options="categories.map((item) => ({ label: item.label, value: item.id }))"
          @update:model-value="$emit('category', $event)"
        />
      </div>
    </div>
    <div class="filter-feedback">
      <span role="status"
        >{{ count }}
        {{ count === 1 ? 'cadastro encontrado' : 'cadastros encontrados' }}</span
      ><q-btn
        v-if="search || status || category || boxId"
        flat
        no-caps
        color="primary"
        icon="filter_alt_off"
        label="Limpar filtros"
        @click="$emit('clear')"
      />
    </div>
  </div>
</template>
