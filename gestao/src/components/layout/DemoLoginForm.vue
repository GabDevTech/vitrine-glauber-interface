<script setup>
import { useDemoLogin } from '../../composables/useDemoLogin'
const emit = defineEmits(['enter'])
const { email, password, showPassword, error, submit } = useDemoLogin(() => emit('enter'))
const required = (value) => Boolean(String(value ?? '').trim()) || 'Preencha este campo.'
</script>
<template>
  <q-form class="login-form" @submit="submit" @input="error = ''">
    <q-input
      v-model="email"
      outlined
      stack-label
      type="text"
      name="email"
      label="Login"
      placeholder="Seu e-mail…"
      autocomplete="username"
      inputmode="email"
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
    <p v-if="error" class="login-error" role="alert">{{ error }}</p>
    <q-btn
      class="login-submit"
      type="submit"
      color="primary"
      unelevated
      no-caps
      label="Acessar demonstração"
      icon-right="arrow_forward"
      aria-describedby="login-demo-note"
    />
    <p id="login-demo-note" class="login-note">
      Para testar, use qualquer login e senha. Cadastros e fotos ficam neste navegador e
      não afetam a vitrine pública.
    </p>
  </q-form>
</template>
