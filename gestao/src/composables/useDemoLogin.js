import { ref } from 'vue'

// Este estado controla apenas o formulário demonstrativo, sem requisição de rede.
export function useDemoLogin(onEnter) {
  const email = ref('')
  const password = ref('')
  const showPassword = ref(false)
  const error = ref('')
  function submit() {
    if (!email.value.trim() || !password.value.trim()) {
      error.value = 'Preencha o login e a senha para entrar na demonstração.'
      return
    }
    error.value = ''
    onEnter()
  }
  return { email, password, showPassword, error, submit }
}
