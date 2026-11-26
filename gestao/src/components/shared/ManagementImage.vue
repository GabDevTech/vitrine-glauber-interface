<script setup>
import { ref, watch } from 'vue'
import { assetUrl } from '../../config/navigation'
const props = defineProps({ src: String })
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
    :src="failed ? assetUrl('/images/produtos-artesanais.webp') : src"
    alt=""
    width="56"
    height="56"
    loading="lazy"
    @error="failed = true"
  />
</template>
