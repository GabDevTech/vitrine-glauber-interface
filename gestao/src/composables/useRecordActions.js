import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useManagementCatalog } from '../stores/catalog'

// As páginas compartilham o comportamento; o formulário continua em RecordEditor.
export function useRecordActions(initialKind = 'box') {
  const catalog = useManagementCatalog()
  const quasar = useQuasar()
  const editorOpen = ref(false)
  const selected = ref(null)
  const createKind = ref(initialKind)
  const publishing = ref(false)

  function create(kind = initialKind) {
    createKind.value = kind
    selected.value = null
    editorOpen.value = true
  }
  function edit(record) {
    selected.value = record
    editorOpen.value = true
  }
  async function publish(record) {
    if (publishing.value) return
    publishing.value = true
    try {
      await catalog.publish(record)
      quasar.notify({
        type: 'positive',
        message: 'Publicação aprovada e registrada neste navegador.',
        caption: 'A vitrine pública não foi alterada.',
        position: 'top-right',
      })
    } catch (failure) {
      quasar.notify({
        type: 'negative',
        message: failure.message || 'Não foi possível publicar. Tente novamente.',
      })
    } finally {
      publishing.value = false
    }
  }
  return { editorOpen, selected, createKind, create, edit, publish, publishing }
}
