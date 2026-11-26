import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { Dark } from 'quasar'
import { readStorage, writeStorage } from '../../../src/utils/storage'

export const useManagementTheme = defineStore('managementTheme', () => {
  const dark = ref(readStorage('vitrine:gestao:dark', false) === true)
  watch(
    dark,
    (value) => {
      Dark.set(value)
      document.documentElement.style.colorScheme = value ? 'dark' : 'light'
      writeStorage('vitrine:gestao:dark', value)
    },
    { immediate: true },
  )
  const isDark = computed(() => dark.value)
  const toggle = () => {
    dark.value = !dark.value
  }
  return { isDark, toggle }
})
