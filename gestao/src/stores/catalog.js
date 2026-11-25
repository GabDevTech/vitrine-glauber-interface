import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  fetchManagementCatalog,
  mapApiBox,
  mapApiCategory,
  mapApiProduct,
} from '../services/catalogService.js'
import { managementApi } from '../services/managementApi.js'
import { enrichRecords, summarizeRecords, validateRecord } from '../utils/records.js'

function extractMediaId(url) {
  if (!url) return null
  const match = String(url).match(/\/media\/(\d+)$/)
  return match ? match[1] : null
}

function parseBoxNumber(raw) {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) return raw
  const match = String(raw || '').match(/\d+/)
  return match ? Number.parseInt(match[0], 10) : null
}

export const useManagementCatalog = defineStore('managementCatalog', () => {
  const records = ref([])
  const categories = ref([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')
  const boxes = computed(() => records.value.filter((item) => item.kind === 'box'))
  const summary = computed(() => summarizeRecords(records.value))
  const pending = computed(() =>
    records.value.filter(
      (item) => item.status !== 'publicado' && item.status !== 'inativado',
    ),
  )
  let request = null
  let generation = 0

  function categoriesByIdMap() {
    return new Map(categories.value.map((c) => [c.apiId, c]))
  }

  function upsertRecord(mapped) {
    const next = records.value.filter(
      (item) => !(item.kind === mapped.kind && item.id === mapped.id),
    )
    next.unshift(mapped)
    records.value = enrichRecords(next, categories.value)
    return records.value.find(
      (item) => item.kind === mapped.kind && item.id === mapped.id,
    )
  }

  async function load({ force = false } = {}) {
    if (loaded.value && !force) return
    if (request) return request
    const session = generation
    loading.value = true
    error.value = ''
    request = fetchManagementCatalog()
      .then((data) => {
        if (session !== generation) return
        records.value = enrichRecords(data.records, data.categories)
        categories.value = data.categories
        loaded.value = true
      })
      .catch((cause) => {
        if (session === generation)
          error.value =
            cause.message || 'Não foi possível carregar os cadastros. Tente novamente.'
      })
      .finally(() => {
        if (session === generation) {
          loading.value = false
          request = null
        }
      })
    return request
  }

  async function save(input, { intent = 'draft' } = {}) {
    const values = JSON.parse(JSON.stringify(input))
    if (!['draft', 'review'].includes(intent))
      throw new Error('Escolha salvar rascunho ou enviar à revisão.')
    const existing = records.value.find(
      (item) => item.kind === values.kind && item.id === values.id,
    )
    const fields = validateRecord(values, {
      boxes: boxes.value,
      categories: categories.value,
      intent,
      existing,
    })
    if (Object.keys(fields).length)
      throw Object.assign(new Error('Confira os campos do cadastro.'), { fields })

    const selectedCategory = categories.value.find((c) => c.id === values.category)

    if (values.kind === 'box') {
      const payload = {
        name: values.name?.trim(),
        ownerName: values.owner?.trim() || null,
        boxNumber: parseBoxNumber(values.number ?? values.boxNumber),
        location: values.location?.trim() || null,
        openingHours: values.hours?.trim() || null,
        description: values.description?.trim() || null,
        story: values.story?.trim() || null,
        whatsapp: values.whatsapp?.trim() || null,
        allowPublicContact: Boolean(values.allowPublicContact),
        coverMediaId:
          extractMediaId(values.photos?.[0]) ?? existing?.coverMediaId ?? null,
        ownerPortraitId:
          extractMediaId(values.ownerPhoto) ??
          (values.ownerPhoto === '' ? null : existing?.ownerPortraitId ?? null),
        ...(selectedCategory ? { categoryIds: [selectedCategory.apiId] } : {}),
      }
      const res = existing
        ? await managementApi.updateBoxRevision(existing.apiId, {
            ...payload,
            version: existing.version,
          })
        : await managementApi.createBox(payload)
      let apiBox = res.data
      if (intent === 'review') {
        const sub = await managementApi.submitBoxReview(apiBox.id)
        apiBox = sub.data
      }
      return upsertRecord(mapApiBox(apiBox))
    }

    const mediaPayload = (values.photos || [])
      .map((url, idx) => {
        const mediaId = extractMediaId(url)
        return mediaId ? { mediaId, position: idx + 1, isCover: idx === 0 } : null
      })
      .filter(Boolean)

    const productPayload = {
      name: values.name?.trim(),
      boxId: values.boxId ? String(values.boxId) : null,
      categoryId: selectedCategory ? selectedCategory.apiId : null,
      description: values.description?.trim() || null,
      priceCents:
        values.price === '' || values.price == null
          ? null
          : Math.round(Number(values.price) * 100),
      ...(mediaPayload.length ? { media: mediaPayload } : {}),
    }
    const res = existing
      ? await managementApi.updateProductRevision(existing.apiId, {
          ...productPayload,
          version: existing.version,
        })
      : await managementApi.createProduct(productPayload)
    let apiProduct = res.data
    if (intent === 'review') {
      const sub = await managementApi.submitProductReview(apiProduct.id)
      apiProduct = sub.data
    }
    return upsertRecord(mapApiProduct(apiProduct, categoriesByIdMap()))
  }

  async function approve(record) {
    const res =
      record.kind === 'box'
        ? await managementApi.approveBox(record.apiId)
        : await managementApi.approveProduct(record.apiId)
    return upsertRecord(
      record.kind === 'box'
        ? mapApiBox(res.data)
        : mapApiProduct(res.data, categoriesByIdMap()),
    )
  }

  async function returnRevision(record, comment) {
    const res =
      record.kind === 'box'
        ? await managementApi.returnBox(record.apiId, comment)
        : await managementApi.returnProduct(record.apiId, comment)
    return upsertRecord(
      record.kind === 'box'
        ? mapApiBox(res.data)
        : mapApiProduct(res.data, categoriesByIdMap()),
    )
  }

  async function publish(record) {
    const res =
      record.kind === 'box'
        ? await managementApi.publishBox(record.apiId)
        : await managementApi.publishProduct(record.apiId)
    return upsertRecord(
      record.kind === 'box'
        ? mapApiBox(res.data)
        : mapApiProduct(res.data, categoriesByIdMap()),
    )
  }

  async function deactivate(record) {
    const res =
      record.kind === 'box'
        ? await managementApi.deactivateBox(record.apiId)
        : await managementApi.deactivateProduct(record.apiId)
    return upsertRecord(
      record.kind === 'box'
        ? mapApiBox(res.data)
        : mapApiProduct(res.data, categoriesByIdMap()),
    )
  }

  async function reactivate(record) {
    const res =
      record.kind === 'box'
        ? await managementApi.reactivateBox(record.apiId)
        : await managementApi.reactivateProduct(record.apiId)
    return upsertRecord(
      record.kind === 'box'
        ? mapApiBox(res.data)
        : mapApiProduct(res.data, categoriesByIdMap()),
    )
  }

  async function createCategory(payload) {
    const res = await managementApi.createCategory(payload)
    const mapped = mapApiCategory(res.data)
    categories.value = [...categories.value, mapped].sort((a, b) =>
      a.label.localeCompare(b.label, 'pt-BR'),
    )
    return mapped
  }

  async function updateCategory(category, payload) {
    const res = await managementApi.updateCategory(category.apiId, {
      ...payload,
      version: category.version,
    })
    const mapped = mapApiCategory(res.data)
    categories.value = categories.value
      .map((c) => (c.apiId === mapped.apiId ? mapped : c))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
    return mapped
  }

  async function toggleCategoryActive(category) {
    const res = category.active
      ? await managementApi.deactivateCategory(category.apiId)
      : await managementApi.activateCategory(category.apiId)
    const mapped = mapApiCategory(res.data)
    categories.value = categories.value.map((c) =>
      c.apiId === mapped.apiId ? mapped : c,
    )
    return mapped
  }

  async function deleteCategory(category) {
    await managementApi.deleteCategory(category.apiId)
    categories.value = categories.value.filter((c) => c.apiId !== category.apiId)
  }

  function reset() {
    generation++
    records.value = []
    categories.value = []
    loading.value = false
    loaded.value = false
    error.value = ''
    request = null
  }

  return {
    records,
    categories,
    boxes,
    summary,
    pending,
    loading,
    loaded,
    error,
    load,
    save,
    approve,
    returnRevision,
    publish,
    deactivate,
    reactivate,
    createCategory,
    updateCategory,
    toggleCategoryActive,
    deleteCategory,
    reset,
    clear: reset,
  }
})
