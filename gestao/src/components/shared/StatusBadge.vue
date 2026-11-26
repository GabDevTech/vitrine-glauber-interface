<script setup>
import { computed } from 'vue'
import { statusByValue } from '../../config/statuses'
const props = defineProps({ value: String })
const status = computed(
  () => statusByValue(props.value) || { label: 'Não definido', tone: 'draft' },
)
</script>
<template>
  <span class="status-badge" :class="`status-${status.tone}`"
    ><span aria-hidden="true"></span>{{ status.label }}</span
  >
</template>
