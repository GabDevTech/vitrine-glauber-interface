import { ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchCatalog } from '../services/catalogService'

export const useCatalogStore = defineStore('catalog', () => {
  const boxes = ref([])
  const categories = ref([])
  const products = ref([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')
  let pendingRequest = null

  // Páginas compartilham a mesma requisição, sem atrasos artificiais.
  async function loadCatalog({ force = false } = {}) {
    if (pendingRequest) return pendingRequest
    if (loaded.value && !force) return
    loading.value = true
    error.value = ''
    pendingRequest = fetchCatalog()
      .then((data) => {
        boxes.value = data.boxes
        categories.value = data.categories
        products.value = data.products
        loaded.value = true
      })
      .catch(() => {
        error.value = 'Não foi possível carregar o catálogo. Tente novamente.'
      })
      .finally(() => {
        loading.value = false
        pendingRequest = null
      })
    return pendingRequest
  }
  return {
    boxes,
    categories,
    products,
    loading,
    loaded,
    error,
    loadCatalog,
    boxBySlug: (slug) => boxes.value.find((box) => box.slug === slug),
    boxById: (id) => boxes.value.find((box) => box.id === id),
    productBySlug: (slug) => products.value.find((product) => product.slug === slug),
    productsByBox: (id) => products.value.filter((product) => product.boxId === id),
  }
})
