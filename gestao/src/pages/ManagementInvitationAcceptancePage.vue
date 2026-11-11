<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
const reviewing = ref(false)
const retryAfterSeconds = ref(0)
const passwordVisible = ref(false)
let countdownTimer
const tokenMissing = computed(() => !token.value)
const countdownLabel = computed(() => {
  const minutes = Math.floor(retryAfterSeconds.value / 60)
  const seconds = retryAfterSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

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

function startCountdown(seconds) {
  retryAfterSeconds.value = Math.max(0, seconds)
  clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    retryAfterSeconds.value = Math.max(0, retryAfterSeconds.value - 1)
    if (retryAfterSeconds.value === 0) clearInterval(countdownTimer)
  }, 1000)
}

onBeforeUnmount(() => clearInterval(countdownTimer))

async function submit() {
  error.value = ''
  if (!reviewing.value) {
    if (password.value !== passwordConfirmation.value) {
      error.value = 'As senhas não coincidem.'
      return
    }
    reviewing.value = true
    return
  }
  if (retryAfterSeconds.value > 0) return
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
    } else if (cause instanceof AuthApiError && cause.code === 'INVALID_REAL_NAME') {
      reviewing.value = false
      error.value = 'Informe um nome real entre 2 e 130 caracteres.'
    } else if (cause instanceof AuthApiError && cause.code === 'INVALID_USERNAME') {
      reviewing.value = false
      error.value =
        'O nome de usuário deve ter de 3 a 30 caracteres e usar letras, números, ponto, hífen ou sublinhado.'
    } else if (cause instanceof AuthApiError && cause.code === 'INVALID_PASSWORD') {
      reviewing.value = false
      error.value = 'A senha deve ter entre 8 e 130 caracteres.'
    } else if (
      cause instanceof AuthApiError &&
      cause.code === 'INVITATION_IDENTITY_MISMATCH'
    ) {
      reviewing.value = false
      error.value =
        'O nome informado não corresponde aos dados definidos pelo administrador.'
    } else if (cause instanceof AuthApiError && cause.code === 'USERNAME_UNAVAILABLE') {
      error.value = 'Esse nome de usuário já está em uso. Escolha outro.'
      reviewing.value = false
    } else if (
      cause instanceof AuthApiError &&
      cause.code === 'BOOTSTRAP_INVITATION_LOCKED'
    ) {
      reviewing.value = false
      startCountdown(cause.retryAfterSeconds || 120)
      error.value =
        'Cinco tentativas incorretas. Aguarde o contador para tentar novamente.'
    } else if (
      cause instanceof AuthApiError &&
      cause.code === 'INVITATION_ATTEMPTS_EXCEEDED'
    ) {
      error.value = 'O limite de tentativas foi atingido. Peça o reenvio do convite.'
    } else if (cause instanceof AuthApiError && cause.status === 429) {
      error.value =
        'O limite de tentativas foi atingido. Aguarde antes de tentar novamente.'
    } else if (cause instanceof AuthApiError && cause.code === 'CSRF_VALIDATION_FAILED') {
      error.value =
        'A validação de segurança expirou. Atualize a página e tente novamente.'
    } else if (cause instanceof AuthApiError && cause.code === 'UNTRUSTED_ORIGIN') {
      error.value =
        'O endereço desta página não foi autorizado pela API. Acesse a gestão pelo endereço configurado.'
    } else if (!(cause instanceof AuthApiError) || cause.status >= 500) {
      error.value =
        'Não foi possível concluir agora. Verifique se a API está ativa e tente novamente.'
    } else if (cause.code === 'INVALID_INVITATION') {
      error.value = 'Este convite não existe, já foi usado ou foi revogado.'
    } else {
      error.value =
        'Não foi possível validar os dados. Revise o formulário e tente novamente.'
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
          <template v-if="!reviewing">
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
          </template>
          <div v-else class="invitation-review" aria-live="polite">
            <h2>Confirme seus dados</h2>
            <p>Confira as informações antes de criar seu acesso.</p>
            <dl>
              <dt>Nome real</dt>
              <dd>{{ realName }}</dd>
              <dt>Nome de usuário</dt>
              <dd>{{ username }}</dd>
              <dt>Senha</dt>
              <dd>
                <span>{{ passwordVisible ? password : '••••••••' }}</span>
                <q-btn
                  class="password-toggle"
                  flat
                  dense
                  no-caps
                  type="button"
                  :label="passwordVisible ? 'Ocultar' : 'Mostrar'"
                  :aria-label="passwordVisible ? 'Ocultar senha' : 'Mostrar senha'"
                  @click="passwordVisible = !passwordVisible"
                />
              </dd>
            </dl>
            <q-btn flat no-caps label="Voltar e corrigir" @click="reviewing = false" />
          </div>
          <p v-if="retryAfterSeconds > 0" class="login-error" role="status">
            Aguarde {{ countdownLabel }} para recuperar suas tentativas.
          </p>
          <p v-if="error" class="login-error" role="alert">{{ error }}</p>
          <q-btn
            class="login-submit"
            type="submit"
            color="primary"
            unelevated
            no-caps
            :label="reviewing ? 'Confirmar e criar acesso' : 'Revisar meus dados'"
            :loading="loading"
            :disable="loading || tokenMissing || submitted || retryAfterSeconds > 0"
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
