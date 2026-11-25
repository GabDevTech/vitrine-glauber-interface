import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useManagementCatalog } from '../stores/catalog'
import { useManagementSession } from '../stores/session'

// As páginas compartilham o comportamento; o formulário continua em RecordEditor.
export function useRecordActions(initialKind = 'box') {
  const catalog = useManagementCatalog()
  const session = useManagementSession()
  const quasar = useQuasar()
  const editorOpen = ref(false)
  const selected = ref(null)
  const createKind = ref(initialKind)
  const publishing = ref(false)

  const canModerate = computed(() => {
    const roles = session.user?.roles || []
    return roles.includes('moderator') || roles.includes('admin')
  })

  function create(kind = initialKind) {
    createKind.value = kind
    selected.value = null
    editorOpen.value = true
  }
  function edit(record) {
    selected.value = record
    editorOpen.value = true
  }

  async function runAction(actionFn, successMessage, errorMessage) {
    if (publishing.value) return
    publishing.value = true
    try {
      await actionFn()
      quasar.notify({
        type: 'positive',
        message: successMessage,
        position: 'top-right',
      })
    } catch (failure) {
      const detailMessages = failure.details
        ? Object.values(failure.details).flat().filter(Boolean).join(' ')
        : ''
      quasar.notify({
        type: 'negative',
        message: failure.message || errorMessage,
        caption: detailMessages || undefined,
        position: 'top-right',
      })
    } finally {
      publishing.value = false
    }
  }

  function approve(record) {
    return runAction(
      () => catalog.approve(record),
      'Revisão aprovada e pronta para publicação.',
      'Não foi possível aprovar a revisão.',
    )
  }

  function returnRevision(record, comment) {
    return runAction(
      () => catalog.returnRevision(record, comment),
      'Revisão devolvida para rascunho.',
      'Não foi possível devolver a revisão.',
    )
  }

  function publish(record) {
    return runAction(
      () => catalog.publish(record),
      'Publicado com sucesso na vitrine pública.',
      'Não foi possível publicar. Tente novamente.',
    )
  }

  function deactivate(record) {
    return runAction(
      () => catalog.deactivate(record),
      'Cadastro inativado e retirado da vitrine pública.',
      'Não foi possível inativar este cadastro.',
    )
  }

  function reactivate(record) {
    return runAction(
      () => catalog.reactivate(record),
      'Cadastro reativado e publicado novamente na vitrine pública.',
      'Não foi possível reativar este cadastro.',
    )
  }

  return {
    editorOpen,
    selected,
    createKind,
    canModerate,
    create,
    edit,
    approve,
    returnRevision,
    publish,
    deactivate,
    reactivate,
    publishing,
  }
}
