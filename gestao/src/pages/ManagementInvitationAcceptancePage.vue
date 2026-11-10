<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ManagementBrand from '../components/layout/ManagementBrand.vue'
import { AuthApiError, acceptInvitation } from '../services/authService'

const router = useRouter()
const token = ref('')
const realName = ref('')
const username = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)
const error = ref('')
const submitted = ref(false)
const tokenMissing = computed(() => !token.value)

onMounted(() => {
  const params = new URLSearchParams(window.location.hash.slice(1))
  token.value = params.get('token') || ''
  window.history.replaceState(
    window.history.state,
    '',
    window.location.pathname + window.location.search,
  )
  if (!token.value)
    error.value =
      'O link do convite está incompleto. Peça ao administrador que envie um novo.'
})

async function submit() {
  error.value = ''
  if (password.value !== passwordConfirmation.value) {
    error.value = 'As senhas não coincidem.'
    return
  }
  loading.value = true
  try {
    await acceptInvitation({
      token: token.value,
      realName: realName.value,
      username: username.value,
      password: password.value,
    })
    submitted.value = true
    await router.replace({ path: '/gestao/login', query: { convite: 'aceito' } })
  } catch (cause) {
    if (cause instanceof AuthApiError && cause.code === 'INVITATION_EXPIRED') {
      error.value = 'Este convite expirou. Peça ao administrador que envie outro.'
    } else if (
      cause instanceof AuthApiError &&
      cause.code === 'INVITATION_IDENTITY_MISMATCH'
    ) {
      error.value =
        'O nome informado não corresponde aos dados definidos pelo administrador.'
    } else if (cause instanceof AuthApiError && cause.code === 'USERNAME_UNAVAILABLE') {
      error.value = 'Esse nome de usuário já está em uso. Escolha outro.'
    } else if (cause instanceof AuthApiError && cause.status === 429) {
      error.value =
        'O limite de tentativas foi atingido. Aguarde antes de tentar novamente.'
    } else {
      error.value = 'O convite é inválido ou não está mais disponível.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="management-login">
    <aside class="login-art" aria-label="Vitrine Glauber">
      <ManagementBrand :linked="false" negative />
      <div class="login-art-content">
        <h2>Um primeiro acesso <span>seguro à gestão.</span></h2>
      </div>
    </aside>
    <section class="login-copy" aria-labelledby="invite-title">
      <div class="login-entry">
        <header class="login-heading">
          <h1 id="invite-title">Aceitar convite</h1>
          <p>Confirme seu nome completo e crie seu nome de usuário e senha.</p>
        </header>
        <form class="login-form" @submit.prevent="submit">
          <q-input
            v-model="realName"
            outlined
            label="Nome real completo"
            autocomplete="name"
            maxlength="130"
            required
          />
          <q-input
            v-model="username"
            outlined
            label="Nome de usuário"
            autocomplete="username"
            maxlength="30"
            required
          />
          <q-input
            v-model="password"
            outlined
            label="Crie uma senha"
            type="password"
            autocomplete="new-password"
            minlength="8"
            maxlength="130"
            required
          />
          <q-input
            v-model="passwordConfirmation"
            outlined
            label="Confirme a senha"
            type="password"
            autocomplete="new-password"
            minlength="8"
            maxlength="130"
            required
          />
          <p v-if="error" class="login-error" role="alert">{{ error }}</p>
          <q-btn
            class="login-submit"
            type="submit"
            color="primary"
            unelevated
            no-caps
            label="Criar acesso"
            :loading="loading"
            :disable="loading || tokenMissing || submitted"
          />
          <p class="login-note">
            A senha deve ter entre 8 e 130 caracteres. Depois de concluir, você será
            levado à tela de login para entrar com seus dados.
          </p>
        </form>
      </div>
    </section>
  </main>
</template>
