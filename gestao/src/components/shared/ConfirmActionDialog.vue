<script setup>
const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  cancelLabel: { type: String, default: 'Cancelar' },
  confirmLabel: { type: String, default: 'Confirmar' },
  confirmColor: { type: String, default: 'negative' },
  confirmTextColor: { type: String, default: undefined },
  loading: Boolean,
})
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

function handleUpdate(value) {
  if (!value && !props.loading) {
    emit('update:modelValue', false)
    emit('cancel')
  }
}

function cancel() {
  if (props.loading) return
  emit('update:modelValue', false)
  emit('cancel')
}
</script>
<template>
  <q-dialog
    :model-value="modelValue"
    :persistent="loading"
    :aria-label="title"
    @update:model-value="handleUpdate"
  >
    <q-card class="discard-confirmation">
      <q-card-section>
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat no-caps :label="cancelLabel" :disable="loading" @click="cancel" />
        <q-btn
          :color="confirmColor"
          :text-color="confirmTextColor"
          unelevated
          no-caps
          :label="confirmLabel"
          :loading="loading"
          @click="$emit('confirm')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
