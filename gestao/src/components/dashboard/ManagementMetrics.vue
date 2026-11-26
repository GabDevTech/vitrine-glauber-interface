<script setup>
import { computed } from 'vue'
const props = defineProps({ summary: { type: Object, required: true } })
const metrics = computed(() => [
  {
    label: 'Boxes cadastrados',
    value: props.summary.boxes,
    icon: 'storefront',
    note: 'Espaços e expositores',
    to: '/gestao/boxes',
  },
  {
    label: 'Produtos cadastrados',
    value: props.summary.products,
    icon: 'shopping_bag',
    note: 'Itens da vitrine',
    to: '/gestao/produtos',
  },
  {
    label: 'Em revisão',
    value: props.summary.review,
    icon: 'fact_check',
    note: 'Aguardando conferência',
    to: '/gestao/revisoes?status=em-revisao',
  },
  {
    label: 'Prontos para publicar',
    value: props.summary.ready,
    icon: 'task_alt',
    note: 'Última etapa da publicação',
    to: '/gestao/revisoes?status=pronto',
  },
])
</script>
<template>
  <section class="management-metrics" aria-label="Resumo dos dados de exemplo">
    <article v-for="metric in metrics" :key="metric.label">
      <div>
        <span>{{ metric.label }}</span
        ><q-icon :name="metric.icon" />
      </div>
      <strong>{{ metric.value }}</strong>
      <router-link
        :to="metric.to"
        class="metric-link"
        :aria-label="`${metric.label}: ${metric.value}. ${metric.note}`"
        >{{ metric.note }}<q-icon name="arrow_forward" aria-hidden="true"
      /></router-link>
    </article>
  </section>
</template>
