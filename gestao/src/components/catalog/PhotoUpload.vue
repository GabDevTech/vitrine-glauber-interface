<script setup>
import { computed, ref } from 'vue'
import { prepareImage } from '../../utils/media'

const photos = defineModel({ type: Array, default: () => [] })
const props = defineProps({
  portrait: Boolean,
  disabled: Boolean,
  error: { type: String, default: '' },
})
const emit = defineEmits(['processing'])
const fileInput = ref(null)
const processing = ref(false)
const localError = ref('')
const limit = computed(() => (props.portrait ? 1 : 5))
const title = computed(() =>
  props.portrait ? 'Foto do responsável (opcional)' : 'Fotos do produto',
)
const inputId = computed(() =>
  props.portrait ? 'owner-photo-input' : 'product-photo-input',
)

async function addPhotos(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (!files.length || processing.value || props.disabled) return
  processing.value = true
  emit('processing', true)
  localError.value = ''
  const next = props.portrait ? [] : [...photos.value]
  const available = limit.value - next.length
  const failures = []
  if (files.length > available)
    failures.push(
      `Selecione até ${limit.value} ${props.portrait ? 'foto' : 'fotos'} no total.`,
    )
  try {
    for (const file of files.slice(0, available)) {
      try {
        next.push(await prepareImage(file))
      } catch (failure) {
        failures.push(
          `${file.name}: ${failure.message || 'Não foi possível ler esta foto. Tente outro arquivo.'}`,
        )
      }
    }
    // Um retrato inválido conserva a foto que já estava no formulário.
    if (!props.portrait || next.length) photos.value = next
    localError.value = failures.join(' ')
  } finally {
    processing.value = false
    emit('processing', false)
  }
}
function removePhoto(index) {
  photos.value = photos.value.filter((_, position) => position !== index)
  localError.value = ''
}
function chooseCover(index) {
  const next = [...photos.value]
  next.unshift(...next.splice(index, 1))
  photos.value = next
}
</script>
<template>
  <fieldset class="editor-group photo-upload" :disabled="disabled || processing">
    <legend>{{ title }}</legend>
    <p :id="`${inputId}-help`" class="editor-group-description">
      {{
        portrait
          ? 'Se desejar, adicione um retrato de quem cuida do box.'
          : 'Adicione até 5 fotos. A primeira é a capa. Para enviar à revisão, inclua pelo menos uma.'
      }}
      JPG, PNG ou WebP, até 8 MB por arquivo.
    </p>
    <div
      v-if="photos.length"
      class="photo-gallery"
      :class="{ 'photo-gallery--portrait': portrait }"
    >
      <div
        v-for="(photo, index) in photos"
        :key="`${index}-${photo.slice(-32)}`"
        class="photo-preview"
      >
        <img
          :src="photo"
          :alt="
            portrait
              ? 'Prévia do retrato do responsável'
              : `Prévia da foto ${index + 1} do produto`
          "
        />
        <span v-if="!portrait && index === 0" class="photo-cover-label">Capa</span>
        <div class="photo-actions">
          <q-btn
            v-if="!portrait && index > 0"
            flat
            dense
            no-caps
            label="Usar como capa"
            :aria-label="`Usar foto ${index + 1} como capa`"
            :disable="disabled || processing"
            @click="chooseCover(index)"
          />
          <q-btn
            flat
            dense
            no-caps
            icon="delete_outline"
            label="Remover"
            :aria-label="
              portrait ? 'Remover foto do responsável' : `Remover foto ${index + 1}`
            "
            :disable="disabled || processing"
            @click="removePhoto(index)"
          />
        </div>
      </div>
    </div>
    <p v-else class="photo-empty">
      {{
        portrait
          ? 'Nenhum retrato adicionado.'
          : 'Nenhuma foto adicionada. Você pode guardar o rascunho e continuar depois.'
      }}
    </p>
    <input
      :id="inputId"
      ref="fileInput"
      class="photo-file-input"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      :multiple="!portrait"
      :disabled="disabled || processing || (!portrait && photos.length >= limit)"
      :aria-label="
        portrait ? 'Selecionar foto do responsável' : 'Selecionar fotos do produto'
      "
      :aria-describedby="`${inputId}-help ${inputId}-error`"
      @change="addPhotos"
    />
    <q-btn
      outline
      no-caps
      icon="add_photo_alternate"
      :label="
        portrait && photos.length
          ? 'Trocar retrato'
          : portrait
            ? 'Adicionar retrato'
            : 'Adicionar fotos'
      "
      :loading="processing"
      :disable="disabled || processing || (!portrait && photos.length >= limit)"
      @click="fileInput.click()"
    />
    <span v-if="!portrait" class="photo-count">{{ photos.length }} de 5 fotos</span>
    <p v-if="processing" class="photo-processing" role="status">
      Preparando fotos… Aguarde antes de salvar.
    </p>
    <p
      :id="`${inputId}-error`"
      v-show="localError || error"
      class="photo-error"
      role="alert"
    >
      {{ localError || error }}
    </p>
  </fieldset>
</template>
