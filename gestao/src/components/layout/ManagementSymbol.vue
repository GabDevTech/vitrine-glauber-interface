<script setup>
import { assetUrl } from '../../config/navigation'
defineProps({ negative: Boolean })
</script>
<template>
  <!-- As duas camadas oficiais mantêm a posição e a proporção do Figma. -->
  <span class="management-symbol" aria-hidden="true">
    <img
      class="management-symbol-g"
      :width="negative ? 215.814 : 320"
      :height="negative ? 215.814 : 320"
      :src="
        assetUrl(
          negative ? '/brand/management-g-negative.svg' : '/brand/management-g.svg',
        )
      "
      alt=""
    />
    <img
      class="management-symbol-panels"
      :width="negative ? 159.163 : 236"
      :height="negative ? 36.4186 : 54"
      :src="
        assetUrl(
          negative
            ? '/brand/management-panels-negative.svg'
            : '/brand/management-panels.svg',
        )
      "
      alt=""
    />
  </span>
</template>
<style scoped>
.management-symbol {
  position: relative;
  display: block;
  width: var(--management-symbol-size, 60px);
  aspect-ratio: 1;
  flex: none;
}
.management-symbol-g {
  position: absolute;
  left: 12.79%;
  top: 12.79%;
  width: 74.42%;
  height: auto;
}
.management-symbol-panels {
  position: absolute;
  left: 32.33%;
  top: 32.33%;
  width: 54.88%;
  height: auto;
}
</style>
