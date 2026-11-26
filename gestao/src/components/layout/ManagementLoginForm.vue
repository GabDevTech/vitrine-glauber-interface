<script setup>
import { ref } from 'vue'
const emit = defineEmits(['submit'])
defineProps({ loading: Boolean })
const login = ref('')
const password = ref('')
const showPassword = ref(false)
const required = (value) => Boolean(String(value ?? '').trim()) || 'Preencha este campo.'
function submit() {
  emit('submit', { login: login.value, password: password.value })
}
</script>
<template>
  <q-form class="login-form" @submit.prevent="submit">
    <q-input
      v-model="login"
      outlined
      stack-label
      type="text"
      name="login"
      label="E-mail ou nome de usuário"
      placeholder="E-mail ou nome de usuário"
      autocomplete="username"
      autocapitalize="none"
      enterkeyhint="next"
      :spellcheck="false"
      :rules="[required]"
      lazy-rules
      hide-bottom-space
    />
    <q-input
      v-model="password"
      outlined
      stack-label
      :type="showPassword ? 'text' : 'password'"
      name="password"
      label="Senha"
      placeholder="Sua senha…"
      autocomplete="current-password"
      enterkeyhint="go"
      :rules="[required]"
      lazy-rules
      hide-bottom-space
    >
      <template #append
        ><q-btn
          type="button"
          flat
          round
          dense
          :icon="showPassword ? 'visibility_off' : 'visibility'"
          :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
          :aria-pressed="showPassword"
          @click="showPassword = !showPassword"
      /></template>
    </q-input>
    <q-btn
      class="login-submit"
      type="submit"
      color="primary"
      unelevated
      no-caps
      label="Entrar"
      icon-right="arrow_forward"
      :loading="loading"
      :disable="loading"
    />
    <p class="login-note">
      Use o e-mail ou nome de usuário e a senha definidos ao aceitar o convite.
    </p>
  </q-form>
</template>
