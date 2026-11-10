<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useManagementSession } from '../stores/session'
import { AuthApiError } from '../services/authService'
import { assetUrl, publicSiteUrl } from '../config/navigation'
import ManagementBrand from '../components/layout/ManagementBrand.vue'
import ManagementLoginForm from '../components/layout/ManagementLoginForm.vue'
const session = useManagementSession()
const router = useRouter()
const error = ref('')
const route = useRoute()
async function enter(credentials) {
  error.value = ''
  try {
    await session.login(credentials)
    await router.replace('/gestao/painel')
  } catch (cause) {
    error.value =
      cause instanceof AuthApiError && cause.status === 429
        ? 'Muitas tentativas. Aguarde e tente novamente.'
        : 'Não foi possível entrar. Confira suas credenciais e tente novamente.'
  }
}
</script>
<template>
  <main class="management-login">
    <aside class="login-art" aria-label="Cultura local na Vitrine Glauber">
      <img
        class="login-photo"
        :src="assetUrl('/images/login-feira-cultural.webp')"
        alt=""
        width="1024"
        height="1536"
        fetchpriority="high"
      />
      <ManagementBrand :linked="false" negative />
      <div class="login-art-content">
        <h2>Mais espaço <span>para quem cria.</span></h2>
        <p>Centro Cultural Glauber Rocha<br />Vitória da Conquista · Bahia</p>
        <span>Imagem ilustrativa</span>
      </div>
    </aside>
    <section class="login-copy" aria-labelledby="login-title">
      <ManagementBrand class="login-mobile-brand" :linked="false" />
      <div class="login-entry">
        <header class="login-heading">
          <h1 id="login-title">Boas-vindas à gestão.</h1>
          <p>
            Entre para cuidar dos boxes e produtos<br class="login-desktop-break" />
            da Vitrine Glauber.
          </p>
        </header>
        <p v-if="route.query.convite === 'aceito'" class="login-success" role="status">
          A conta foi criada. Entre com o nome de usuário ou e-mail e a senha que definiu.
        </p>
        <ManagementLoginForm :loading="session.loading" @submit="enter" />
        <p v-if="error" class="login-error" role="alert">{{ error }}</p>
        <a :href="publicSiteUrl" class="management-text-link login-back"
          ><q-icon name="arrow_back" aria-hidden="true" /> Voltar para a vitrine
          pública</a
        >
      </div>
    </section>
  </main>
</template>
