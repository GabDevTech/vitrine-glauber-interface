import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { readStorage, writeStorage } from '../utils/storage'

export const useFavoritesStore = defineStore('favorites', () => {
  const saved = readStorage('vitrine:favorites', [])
  const ids = ref(
    Array.isArray(saved) ? saved.filter((id) => typeof id === 'string') : [],
  )
  const count = computed(() => ids.value.length)
  const has = (type, id) => ids.value.includes(`${type}:${id}`)
  function toggle(type, id) {
    const key = `${type}:${id}`
    ids.value = has(type, id)
      ? ids.value.filter((item) => item !== key)
      : [...ids.value, key]
  }
  watch(ids, (value) => writeStorage('vitrine:favorites', value))
  return { ids, count, has, toggle }
})
