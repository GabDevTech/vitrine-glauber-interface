<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useQuasar } from 'quasar'
import { useManagementCatalog } from '../../stores/catalog'
import RecordFields from './RecordFields.vue'

const open = defineModel({ type: Boolean, default: false })
const props = defineProps({
  record: { type: Object, default: null },
  kind: { type: String, default: 'box' },
})
const catalog = useManagementCatalog()
const quasar = useQuasar()
const form = ref(null)
const draft = ref({})
const baseline = ref('')
const error = ref('')
const photoError = ref('')
const saving = ref(false)
const validating = ref(false)
const validationIntent = ref('draft')
const processing = ref(false)
const confirmingDiscard = ref(false)
let discardResolver = null
const busy = computed(() => saving.value || processing.value)
const dirty = computed(() => open.value && JSON.stringify(draft.value) !== baseline.value)
const title = computed(
  () =>
    `${props.record ? 'Editar' : 'Novo'} ${draft.value.kind === 'product' ? 'produto' : 'box'}`,
)
const canApprove = computed(() => props.record?.status === 'em-revisao')

watch(
  open,
  (visible) => {
    if (!visible) return
    validationIntent.value = 'draft'
    error.value = ''
    photoError.value = ''
    draft.value = {
      kind: props.kind,
      name: '',
      description: '',
      category: '',
      status: 'rascunho',
      boxId: null,
      price: null,
      owner: '',
      number: '',
      photos: [],
      image: '',
      ownerPhoto: '',
      ...JSON.parse(JSON.stringify(props.record || {})),
    }
    if (draft.value.kind === 'product') {
      draft.value.photos = [
        ...(Array.isArray(props.record?.photos)
          ? draft.value.photos
          : draft.value.image
            ? [draft.value.image]
            : []),
      ]
      draft.value.image = draft.value.photos[0] || ''
    }
    baseline.value = JSON.stringify(draft.value)
  },
  { immediate: true },
)
watch(
  () => draft.value.photos?.length,
  (length) => {
    if (length) photoError.value = ''
  },
)

function confirmDiscard() {
  if (!dirty.value) return Promise.resolve(true)
  if (discardResolver) return Promise.resolve(false)
  confirmingDiscard.value = true
  return new Promise((resolve) => {
    discardResolver = resolve
  })
}
function answerDiscard(discard) {
  confirmingDiscard.value = false
  const resolve = discardResolver
  discardResolver = null
  resolve?.(discard)
}
async function requestClose(visible = false) {
  if (visible || busy.value || validating.value) return
  if (await confirmDiscard()) open.value = false
}
onBeforeRouteLeave(async () => {
  if (!open.value) return true
  if (busy.value || validating.value) return false
  const leave = await confirmDiscard()
  if (leave) open.value = false
  return leave
})
function beforeUnload(event) {
  if (!dirty.value && !busy.value) return
  event.preventDefault()
  event.returnValue = ''
}
window.addEventListener('beforeunload', beforeUnload)
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload)
  discardResolver?.(false)
})
async function save(intent, approve = false) {
  if (busy.value || validating.value) return
  validating.value = true
  validationIntent.value = intent
  error.value = ''
  photoError.value = ''
  await nextTick()
  const valid = await form.value.validate()
  validating.value = false
  if (
    intent === 'review' &&
    draft.value.kind === 'product' &&
    !draft.value.photos.length
  ) {
    photoError.value = 'Adicione pelo menos uma foto para enviar o produto à revisão.'
  }
  if (!valid || photoError.value) return
  saving.value = true
  try {
    const saved = await catalog.save(draft.value, { intent })
    // Se a aprovação falhar, mantenha a identidade do cadastro já salvo para tentar outra vez.
    draft.value = JSON.parse(JSON.stringify(saved))
    if (approve) await catalog.approve(saved)
    baseline.value = JSON.stringify(draft.value)
    open.value = false
    quasar.notify({
      type: 'positive',
      message: approve
        ? 'Revisão aprovada. Dados e fotos guardados neste navegador.'
        : intent === 'review'
          ? 'Enviado para revisão. Dados e fotos guardados neste navegador.'
          : 'Rascunho salvo. Dados e fotos guardados neste navegador.',
      caption: 'A vitrine pública não foi alterada.',
      position: 'top-right',
    })
  } catch (failure) {
    photoError.value = failure.fields?.photos || failure.fields?.ownerPhoto || ''
    error.value = [
      failure.message || 'Não foi possível guardar o cadastro. Tente novamente.',
      ...Object.entries(failure.fields || {})
        .filter(([field]) => field !== 'photos' && field !== 'ownerPhoto')
        .map(([, message]) => message),
    ].join(' ')
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <q-dialog
    :model-value="open"
    :persistent="busy || validating || confirmingDiscard"
    :maximized="quasar.screen.width <= 700"
    :aria-label="title"
    aria-describedby="editor-local-note"
    @update:model-value="requestClose"
  >
    <q-card class="record-editor">
      <q-form ref="form" @submit.prevent="save('draft')">
        <q-card-section class="editor-heading">
          <div>
            <h2>{{ title }}</h2>
            <p>Guarde um rascunho ou envie o cadastro para revisão.</p>
          </div>
          <q-btn
            flat
            round
            icon="close"
            aria-label="Fechar formulário"
            :disable="busy || validating"
            @click="requestClose()"
          />
        </q-card-section>
        <q-card-section class="editor-content">
          <p id="editor-local-note" class="editor-notice">
            <q-icon name="info_outline" />Dados e fotos ficam guardados neste navegador. A
            vitrine pública não é alterada.
          </p>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <RecordFields
            v-model="draft"
            :categories="catalog.categories"
            :boxes="catalog.boxes"
            :disabled="busy"
            :photo-error="photoError"
            :validation-intent="validationIntent"
            @processing="processing = $event"
          />
        </q-card-section>
        <q-card-actions align="right" class="editor-actions">
          <q-btn
            flat
            no-caps
            label="Cancelar"
            :disable="busy || validating"
            @click="requestClose()"
          />
          <q-btn
            outline
            no-caps
            label="Salvar rascunho"
            :disable="busy || validating"
            :loading="saving"
            @click="save('draft')"
          />
          <q-btn
            color="primary"
            unelevated
            no-caps
            label="Enviar para revisão"
            :disable="busy || validating"
            @click="save('review')"
          />
          <q-btn
            v-if="canApprove"
            color="primary"
            unelevated
            no-caps
            label="Aprovar revisão"
            :disable="busy || validating"
            @click="save('review', true)"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
  <q-dialog
    :model-value="confirmingDiscard"
    persistent
    aria-label="Descartar alterações?"
  >
    <q-card class="discard-confirmation">
      <q-card-section
        ><h3>Descartar alterações?</h3>
        <p>As alterações deste formulário ainda não foram guardadas.</p></q-card-section
      >
      <q-card-actions align="right"
        ><q-btn
          flat
          no-caps
          label="Continuar editando"
          @click="answerDiscard(false)" /><q-btn
          color="negative"
          unelevated
          no-caps
          label="Descartar alterações"
          @click="answerDiscard(true)"
      /></q-card-actions>
    </q-card>
  </q-dialog>
</template>
