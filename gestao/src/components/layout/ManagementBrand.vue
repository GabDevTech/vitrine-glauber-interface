<script setup>
import ManagementSymbol from './ManagementSymbol.vue'
import { useManagementTheme } from '../../stores/theme'
const theme = useManagementTheme()
defineProps({ linked: { type: Boolean, default: true }, negative: Boolean })
</script>
<template>
  <component
    :is="linked ? 'router-link' : 'div'"
    :to="linked ? '/gestao/painel' : undefined"
    class="management-brand"
    :class="{ 'is-negative': negative }"
    :aria-label="linked ? 'Vitrine Glauber Gestão - visão geral' : undefined"
    translate="no"
  >
    <ManagementSymbol :negative="negative || theme.isDark" />
    <span class="management-wordmark">vitrine glauber<span>gestão</span></span>
  </component>
</template>
<style scoped>
.is-negative,
.is-negative .management-wordmark > span {
  color: white;
}
</style>
