<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
const props = defineProps({
  light: Boolean,
  assetBase: { type: String, default: '/' },
})
const quasar = useQuasar()
const negative = computed(() => props.light || quasar.dark.isActive)
</script>

<template>
  <span
    class="brand"
    :class="{ 'brand--light': negative }"
    aria-label="Vitrine Glauber"
    translate="no"
  >
    <span class="brand__symbol"
      ><img
        :src="
          assetBase + 'brand/' + (negative ? 'symbol-negative.svg' : 'symbol-color.svg')
        "
        alt=""
        width="430"
        height="430"
    /></span>
    <span class="brand__name">vitrine<br />glauber</span>
  </span>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--text);
}
.brand__symbol {
  width: 43px;
  height: 43px;
  overflow: hidden;
  flex: none;
}
.brand__symbol img {
  max-width: none;
  transform: scale(0.1);
  transform-origin: top left;
}
.brand--light .brand__symbol img {
  transform: scale(0.1);
}
.brand__name {
  font-family: var(--font-display);
  font-size: 1.6875rem;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 0.92;
}
.brand--light {
  color: white;
}
</style>
