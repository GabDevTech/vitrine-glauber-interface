import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { boxes as legacyBoxes, products as legacyProducts } from '../data/catalog'
import { readStorage, writeStorage } from '../utils/storage'

export const useFavoritesStore = defineStore('favorites', () => {
  const saved = readStorage('vitrine:favorites:v2', [])
  const ids = ref(
    Array.isArray(saved) ? saved.filter((id) => typeof id === 'string') : [],
  )
  const count = computed(() => ids.value.length)
  const has = (type, id) => ids.value.includes(`${type}:${id}`)
  function migrateLegacyFavorites(catalog) {
    if (readStorage('vitrine:favorites:migrated', false)) return
    const legacy = readStorage('vitrine:favorites', [])
    const migrated = Array.isArray(legacy)
      ? legacy.flatMap((key) => {
          const match = /^(box|product):(\d+)$/.exec(key)
          if (!match) return []
          const source = (match[1] === 'box' ? legacyBoxes : legacyProducts).find(
            (item) => item.id === Number(match[2]),
          )
          const current = (match[1] === 'box' ? catalog.boxes : catalog.products).find(
            (item) => item.slug === source?.slug,
          )
          return current ? [`${match[1]}:${current.id}`] : []
        })
      : []
    ids.value = [...new Set([...ids.value, ...migrated])]
    writeStorage('vitrine:favorites:v2', ids.value)
    writeStorage('vitrine:favorites:migrated', true)
  }
  function toggle(type, id) {
    const key = `${type}:${id}`
    ids.value = has(type, id)
      ? ids.value.filter((item) => item !== key)
      : [...ids.value, key]
  }
  watch(ids, (value) => writeStorage('vitrine:favorites:v2', value))
  return { ids, count, has, toggle, migrateLegacyFavorites }
})
