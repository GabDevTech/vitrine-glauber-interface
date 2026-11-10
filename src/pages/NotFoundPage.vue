<script setup>
import { usePageMeta } from '../composables/usePageMeta'
usePageMeta({
  title: 'Página não encontrada',
  description: 'Continue descobrindo os boxes e produtos da Vitrine Glauber.',
})
</script>
<template>
  <q-page class="page-container not-found">
    <q-icon name="explore_off" />
    <h1>Esse caminho ainda não está na vitrine.</h1>
    <p>
      O endereço pode ter mudado. Que tal continuar pelos boxes ou descobrir um produto
      novo?
    </p>
    <div>
      <q-btn
        color="primary"
        unelevated
        no-caps
        label="Explorar boxes"
        to="/boxes"
      /><q-btn flat color="primary" no-caps label="Voltar ao início" to="/" />
    </div>
  </q-page>
</template>
<style scoped>
.not-found {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding-block: 60px;
}
.not-found > .q-icon {
  color: var(--blue);
  font-size: 3.5rem;
}
h1 {
  max-width: 20ch;
  font-size: 2.875rem;
  line-height: 1.1;
  font-weight: 500;
  margin: 24px 0 20px;
}
p {
  max-width: 48ch;
  color: var(--muted);
  font-size: 0.9375rem;
  margin: 0 0 28px;
}
.not-found > div {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}
</style>
