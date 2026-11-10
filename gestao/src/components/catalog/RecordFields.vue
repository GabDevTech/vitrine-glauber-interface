<script setup>
import { computed } from 'vue'
import { statusByValue } from '../../config/statuses'
import PhotoUpload from './PhotoUpload.vue'
const draft = defineModel({ type: Object, required: true })
const props = defineProps({
  categories: Array,
  boxes: Array,
  disabled: Boolean,
  photoError: String,
  validationIntent: { type: String, default: 'draft' },
})
const emit = defineEmits(['processing'])
const productPhotos = computed({
  get: () => draft.value.photos || [],
  set: (photos) => {
    draft.value.photos = photos
    draft.value.image = photos[0] || ''
  },
})
const ownerPhotos = computed({
  get: () => (draft.value.ownerPhoto ? [draft.value.ownerPhoto] : []),
  set: (photos) => {
    draft.value.ownerPhoto = photos[0] || ''
  },
})
const categoryOptions = computed(() =>
  props.categories.map((item) => ({ label: item.label, value: item.id })),
)
const boxOptions = computed(() =>
  props.boxes.map((item) => ({ label: item.name, value: item.id })),
)
const required = (value) =>
  (value !== null && value !== undefined && value !== '') || 'Preencha este campo.'
const validName = (value) =>
  String(value ?? '').trim().length >= 2 || 'Use pelo menos 2 caracteres.'
</script>
<template>
  <div class="record-fields">
    <fieldset class="editor-group">
      <legend>Informações {{ draft.kind === 'box' ? 'do box' : 'do produto' }}</legend>
      <p class="editor-group-description">Como este cadastro aparece na vitrine.</p>
      <q-input
        v-model="draft.name"
        :disable="disabled"
        outlined
        :label="draft.kind === 'box' ? 'Nome do box' : 'Nome do produto'"
        name="nome"
        autocomplete="off"
        maxlength="80"
        :rules="[validName]"
      />
      <q-input
        v-model="draft.description"
        :disable="disabled"
        outlined
        type="textarea"
        label="Descrição"
        name="descricao"
        maxlength="400"
        counter
        rows="3"
      />
      <div class="form-columns">
        <q-select
          v-model="draft.category"
          :disable="disabled"
          outlined
          label="Categoria"
          :options="categoryOptions"
          emit-value
          map-options
          :rules="props.validationIntent === 'review' ? [required] : []"
        />
      </div>
    </fieldset>
    <fieldset class="editor-group">
      <legend>
        {{ draft.kind === 'product' ? 'Box e preço' : 'Responsável e localização' }}
      </legend>
      <p class="editor-group-description">
        {{
          draft.kind === 'product'
            ? 'Vincule o produto a quem oferece.'
            : 'Identifique quem cuida deste espaço.'
        }}
      </p>
      <template v-if="draft.kind === 'product'">
        <q-select
          v-model="draft.boxId"
          :disable="disabled"
          outlined
          label="Box responsável"
          :options="boxOptions"
          emit-value
          map-options
          :rules="props.validationIntent === 'review' ? [required] : []"
        />
        <q-input
          v-model="draft.price"
          :disable="disabled"
          outlined
          type="number"
          label="Preço em reais (opcional)"
          name="preco"
          min="0"
          step="0.01"
          inputmode="decimal"
          :rules="[
            (value) =>
              value === '' ||
              value == null ||
              (Number.isFinite(Number(value)) && Number(value) >= 0) ||
              'Informe um preço válido.',
          ]"
        />
      </template>
      <div v-else class="form-columns">
        <q-input
          v-model="draft.owner"
          :disable="disabled"
          outlined
          label="Responsável (opcional)"
          name="responsavel"
          maxlength="80"
        /><q-input
          v-model="draft.number"
          :disable="disabled"
          outlined
          label="Número do box (opcional)"
          name="numero"
          maxlength="30"
        />
      </div>
    </fieldset>
    <PhotoUpload
      v-if="draft.kind === 'product'"
      v-model="productPhotos"
      :disabled="disabled"
      :error="photoError"
      @processing="emit('processing', $event)"
    />
    <PhotoUpload
      v-else
      v-model="ownerPhotos"
      :error="photoError"
      portrait
      :disabled="disabled"
      @processing="emit('processing', $event)"
    />
    <fieldset class="editor-group">
      <legend>Revisão e publicação</legend>
      <p class="editor-status">
        Status atual:
        <strong>{{ statusByValue(draft.status)?.label || 'Rascunho' }}</strong>
      </p>
      <p class="editor-group-description">
        {{
          draft.status === 'pronto' || draft.status === 'publicado'
            ? 'Ao salvar alterações, este cadastro precisa passar por uma nova revisão antes de ser publicado.'
            : draft.status === 'em-revisao'
              ? 'Confira os dados e as fotos antes de aprovar a revisão. Depois de aprovado, o cadastro poderá ser publicado pelo painel.'
              : 'Salve como rascunho para continuar depois ou envie para revisão. A publicação exige uma revisão aprovada.'
        }}
      </p>
    </fieldset>
  </div>
</template>
