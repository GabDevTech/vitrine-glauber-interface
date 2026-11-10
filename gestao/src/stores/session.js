import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useManagementCatalog } from './catalog'
import * as authService from '../services/authService'
export const useManagementSession = defineStore('managementSession', () => {
  const user = ref(null)
  const initialized = ref(false)
  const loading = ref(false)
  let initialization = null

  async function initialize({ force = false } = {}) {
    if (initialized.value && !force) return user.value
    if (initialization) return initialization
    loading.value = true
    initialization = authService
      .currentAccount()
      .then((account) => {
        user.value = account
        initialized.value = true
        return account
      })
      .catch((error) => {
        user.value = null
        initialized.value = true
        throw error
      })
      .finally(() => {
        loading.value = false
        initialization = null
      })
    return initialization
  }

  async function login(credentials) {
    loading.value = true
    try {
      user.value = await authService.login(credentials)
      initialized.value = true
      return user.value
    } finally {
      loading.value = false
    }
  }

  async function leave() {
    let failure
    try {
      await authService.logout()
    } catch (error) {
      failure = error
    }
    user.value = null
    initialized.value = true
    useManagementCatalog().clear()
    if (failure) throw failure
  }

  return {
    user,
    active: computed(() => Boolean(user.value)),
    initialized,
    loading,
    initialize,
    login,
    leave,
  }
})
