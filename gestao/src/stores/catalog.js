import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchManagementCatalog } from '../services/catalogService.js'
import { writeCatalogSnapshot } from '../services/catalogStorage.js'
import {
  enrichRecords,
  summarizeRecords,
  uniqueSlug,
  validateRecord,
} from '../utils/records.js'

export const useManagementCatalog = defineStore('managementCatalog', () => {
  const records = ref([])
  const categories = ref([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')
  const boxes = computed(() => records.value.filter((item) => item.kind === 'box'))
  const summary = computed(() => summarizeRecords(records.value))
  const pending = computed(() =>
    records.value.filter((item) => item.status !== 'publicado'),
  )
  let request = null
  let queue = Promise.resolve()
  let generation = 0
  let revision = 0

  async function load() {
    if (loaded.value) return
    if (request) return request
    const session = generation
    loading.value = true
    error.value = ''
    request = fetchManagementCatalog()
      .then((data) => {
        if (session !== generation) return
        records.value = enrichRecords(data.records, data.categories)
        categories.value = data.categories
        revision = data.revision
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

  // Serialize mutations so concurrent saves cannot overwrite a completed transaction.
  function mutate(operation) {
    const session = generation
    const result = queue.then(async () => {
      if (session !== generation)
        throw new Error('A sessão foi encerrada. Entre novamente.')
      const { next, key } = operation()
      const enriched = enrichRecords(next, categories.value)
      const nextRevision = await writeCatalogSnapshot(
        { records: enriched, categories: categories.value },
        { expectedRevision: revision },
      )
      if (session !== generation)
        throw new Error('A sessão foi encerrada. Entre novamente.')
      records.value = enriched
      revision = nextRevision
      return records.value.find((item) => item.kind === key.kind && item.id === key.id)
    })
    queue = result.catch(() => {})
    return result
  }

  function save(input, { intent = 'draft' } = {}) {
    const values = JSON.parse(JSON.stringify(input))
    return mutate(() => {
      if (!['draft', 'review'].includes(intent))
        throw new Error('Escolha salvar rascunho ou enviar à revisão.')
      const existing = records.value.find(
        (item) => item.kind === values.kind && item.id === values.id,
      )
      if (values.id && !existing) throw new Error('Este cadastro não está disponível.')
      const fields = validateRecord(values, {
        boxes: boxes.value,
        categories: categories.value,
        intent,
        existing,
      })
      if (Object.keys(fields).length)
        throw Object.assign(new Error('Confira os campos do cadastro.'), { fields })
      const id =
        existing?.id ??
        Math.max(
          0,
          ...records.value
            .filter((item) => item.kind === values.kind)
            .map((item) => item.id),
        ) + 1
      const photos = [...(values.photos ?? existing?.photos ?? [])]
      const record = {
        ...existing,
        id,
        kind: values.kind,
        slug: existing?.slug || uniqueSlug(values.name, records.value),
        name: values.name.trim(),
        description: String(values.description || '').trim(),
        category: values.category || '',
        status: intent === 'review' ? 'em-revisao' : 'rascunho',
        photos,
        image: photos[0] || '',
      }
      if (values.kind === 'product') {
        record.boxId = Number(values.boxId) || null
        record.price =
          values.price === '' || values.price == null ? null : Number(values.price)
      } else {
        record.owner = String(values.owner || '').trim()
        record.number = String(values.number || '').trim()
        record.ownerPhoto = values.ownerPhoto ?? existing?.ownerPhoto ?? ''
      }
      return {
        next: existing
          ? records.value.map((item) => (item === existing ? record : item))
          : [...records.value, record],
        key: record,
      }
    })
  }

  function transition(record, from, to) {
    const key = { id: record.id, kind: record.kind }
    return mutate(() => {
      const current = records.value.find(
        (item) => item.kind === key.kind && item.id === key.id,
      )
      if (!current || current.status !== from)
        throw new Error(
          to === 'pronto'
            ? 'Somente cadastros em revisão podem ser aprovados.'
            : 'Aprove o cadastro em revisão antes de publicar.',
        )
      return {
        next: records.value.map((item) =>
          item === current ? { ...item, status: to } : item,
        ),
        key,
      }
    })
  }
  const approve = (record) => transition(record, 'em-revisao', 'pronto')
  const publish = (record) => transition(record, 'pronto', 'publicado')
  function clear() {
    generation++
    request = null
    revision = 0
    records.value = []
    categories.value = []
    loaded.value = false
    loading.value = false
    error.value = ''
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
    publish,
    clear,
  }
})
