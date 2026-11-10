import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useManagementCatalog } from '../stores/catalog'
import { filterRecords } from '../utils/records'

const text = (value) => String(Array.isArray(value) ? (value[0] ?? '') : (value ?? ''))
export function useWorkspaceFilters(kind) {
  const route = useRoute()
  const router = useRouter()
  const catalog = useManagementCatalog()
  const search = computed(() => text(route.query.busca))
  const status = computed(() => text(route.query.status))
  const category = computed(() => text(route.query.categoria))
  const boxId = computed(() => text(route.query.box))
  const items = computed(() => {
    const records = kind === 'review' ? catalog.pending : catalog.records
    const enriched = records.map((item) => ({
      ...item,
      boxName:
        item.kind === 'product'
          ? catalog.boxes.find((box) => box.id === item.boxId)?.name ||
            'Box não encontrado'
          : '',
    }))
    return filterRecords(enriched, {
      kind: kind === 'review' ? '' : kind,
      search: search.value,
      status: status.value,
      category: category.value,
      boxId: boxId.value,
    })
  })
  function update(key, value) {
    router.replace({ query: { ...route.query, [key]: value || undefined } })
  }
  function clear() {
    router.replace({ query: {} })
  }
  return { catalog, search, status, category, boxId, items, update, clear }
}
