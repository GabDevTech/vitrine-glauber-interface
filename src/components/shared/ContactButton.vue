<script setup>
import { ref } from 'vue'
import { isDemo } from '../../config/brand'
const props = defineProps({ box: { type: Object, required: true }, productName: String })
const showNotice = ref(false)
function contact() {
  if (isDemo) {
    showNotice.value = true
    return
  }
  const text = props.productName
    ? `Olá! Vi ${props.productName} na Vitrine Glauber. Pode me contar mais?`
    : 'Olá! Encontrei seu box na Vitrine Glauber.'
  window.open(
    `https://wa.me/${props.box.whatsapp}?text=${encodeURIComponent(text)}`,
    '_blank',
    'noopener,noreferrer',
  )
}
</script>
<template>
  <div>
    <q-btn
      color="primary"
      unelevated
      no-caps
      icon="chat_bubble_outline"
      label="Falar com o expositor"
      @click="contact"
    />
    <p v-if="showNotice" class="contact-notice" role="status">
      Este é um expositor demonstrativo. O contato estará disponível quando o catálogo
      real for publicado.
    </p>
  </div>
</template>
<style scoped>
.contact-notice {
  max-width: 48ch;
  margin: 14px 0 0;
  padding: 16px;
  background: var(--blue-soft);
  border-radius: 10px;
  color: var(--text);
  font-size: 0.875rem;
}
</style>
