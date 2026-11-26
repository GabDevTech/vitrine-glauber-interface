import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useManagementCatalog } from '../stores/catalog'
import { useManagementSession } from '../stores/session'
import { buildActionConfirmation } from '../utils/records'

// As páginas compartilham o comportamento; o formulário continua em RecordEditor.
export function useRecordActions(initialKind = 'box') {
  const catalog = useManagementCatalog()
  const session = useManagementSession()
  const quasar = useQuasar()
  const editorOpen = ref(false)
  const selected = ref(null)
  const createKind = ref(initialKind)
  const publishing = ref(false)
  const confirmation = ref(null)
  const confirmOpen = computed({
    get: () => Boolean(confirmation.value),
    set: (value) => {
      if (!value && !publishing.value) confirmation.value = null
    },
  })

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

  function removeBox(record) {
    return runAction(
      () => catalog.removeBox(record),
      'Box excluído definitivamente.',
      'Não foi possível excluir o box.',
    )
  }

  function requestConfirmation(action, record) {
    if (!record || publishing.value) return
    const config = buildActionConfirmation(action, record)
    if (!config) return
    confirmation.value = { action, record, ...config }
  }

  function requestDeactivate(record) {
    requestConfirmation('deactivate', record)
  }

  function requestReactivate(record) {
    requestConfirmation('reactivate', record)
  }

  function requestDeleteBox(record) {
    requestConfirmation('delete', record)
  }

  function cancelConfirmation() {
    if (!publishing.value) confirmation.value = null
  }

  async function confirmAction() {
    if (!confirmation.value || publishing.value) return
    const { action, record } = confirmation.value
    const handlers = {
      deactivate,
      reactivate,
      delete: removeBox,
    }
    const handler = handlers[action]
    try {
      if (handler) await handler(record)
    } finally {
      confirmation.value = null
    }
  }

  return {
    editorOpen,
    selected,
    createKind,
    canModerate,
    confirmation,
    confirmOpen,
    create,
    edit,
    approve,
    returnRevision,
    publish,
    deactivate,
    reactivate,
    removeBox,
    requestDeactivate,
    requestReactivate,
    requestDeleteBox,
    confirmAction,
    cancelConfirmation,
    publishing,
  }
}
