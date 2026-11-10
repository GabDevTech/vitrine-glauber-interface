import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useManagementCatalog } from './catalog'

const key = 'vitrine:gestao:demo'
function readSession() {
  try {
    return sessionStorage.getItem(key) === 'active'
  } catch {
    return false
  }
}
export const useManagementSession = defineStore('managementSession', () => {
  const active = ref(readSession())
  function enter() {
    active.value = true
    try {
      sessionStorage.setItem(key, 'active')
    } catch {
      /* Continua nesta aba sem persistência. */
    }
  }
  function leave() {
    active.value = false
    useManagementCatalog().clear()
    try {
      sessionStorage.removeItem(key)
    } catch {
      /* Estado em memória já foi limpo. */
    }
  }
  return { active, enter, leave }
})
