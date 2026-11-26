<script setup>
import { ref, watch } from 'vue'
const props = defineProps({ src: String, alt: String, eager: Boolean })
const failed = ref(false)
watch(
  () => props.src,
  () => {
    failed.value = false
  },
)
</script>
<template>
  <img
    :src="failed ? '/images/produtos-artesanais.webp' : src"
    :alt="alt"
    :loading="eager ? 'eager' : 'lazy'"
    :fetchpriority="eager ? 'high' : 'auto'"
    width="800"
    height="600"
    decoding="async"
    @error="failed = true"
  />
</template>
