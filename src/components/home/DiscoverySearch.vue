<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const search = ref('')
const router = useRouter()
function submit() {
  router.push({
    path: '/boxes',
    query: search.value.trim() ? { busca: search.value.trim() } : {},
  })
}
</script>
<template>
  <q-form class="discovery-search" role="search" @submit.prevent="submit">
    <q-input
      v-model="search"
      borderless
      name="busca"
      autocomplete="off"
      label="O que você quer descobrir?"
      placeholder="Cerâmica, café, bolsas…"
      class="discovery-input"
    >
      <template #prepend><q-icon name="search" /></template>
    </q-input>
    <q-btn
      type="submit"
      color="primary"
      no-caps
      unelevated
      label="Explorar"
      icon-right="arrow_forward"
    />
  </q-form>
</template>
<style scoped>
.discovery-search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 7px 6px 18px;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: 0 6px 24px rgb(20 45 89 / 5%);
  transition:
    border-color var(--motion-fast),
    box-shadow var(--motion-ui);
}
.discovery-search:focus-within {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--blue-soft);
  outline: 3px solid var(--blue);
  outline-offset: 3px;
}
.discovery-search :deep(.q-field:focus-within) {
  outline: none;
}
.discovery-input {
  flex: 1;
  min-width: 0;
}
.discovery-search .q-btn {
  min-height: 48px;
  padding-inline: 22px;
}
:deep(.q-field__label) {
  font-size: 0.75rem;
}
@media (max-width: 440px) {
  .discovery-search {
    padding-left: 12px;
  }
  .discovery-search .q-btn {
    padding-inline: 14px;
  }
  :deep(.q-btn .q-icon) {
    display: none;
  }
}
</style>
