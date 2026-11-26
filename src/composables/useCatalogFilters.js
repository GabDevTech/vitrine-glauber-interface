import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCatalogStore } from '../stores/catalog'
import { filterCatalog } from '../utils/catalog'

const first = (value) => String(Array.isArray(value) ? (value[0] ?? '') : (value ?? ''))
export function useCatalogFilters(type) {
  const route = useRoute()
  const router = useRouter()
  const catalog = useCatalogStore()
  const query = computed(() => first(route.query.busca))
  const category = computed(
    () => first(route.params.categorySlug || route.query.categoria) || 'todos',
  )
  const sort = computed(() => first(route.query.ordem) || 'destaques')
  const results = computed(() =>
    filterCatalog(
      catalog[type],
      {
        query: query.value,
        category: category.value,
        sort: sort.value,
      },
      catalog.boxes,
      type === 'boxes' ? catalog.products : [],
    ),
  )
  // A URL é a fonte de verdade: compartilhar, atualizar e voltar funcionam juntos.
  function update(key, value) {
    const next = { ...route.query, [key]: value || undefined }
    if (value === 'todos' || value === 'destaques') delete next[key]
    router.replace({ path: type === 'boxes' ? '/boxes' : '/produtos', query: next })
  }
  function clear() {
    router.replace({ path: type === 'boxes' ? '/boxes' : '/produtos', query: {} })
  }
  return { catalog, query, category, sort, results, update, clear }
}
