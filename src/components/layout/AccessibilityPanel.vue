<script setup>
import { useAccessibility } from '../../composables/useAccessibility'
import { useSpeech } from '../../composables/useSpeech'
const open = defineModel({ type: Boolean, default: false })
const { settings, reset } = useAccessibility()
const {
  supported,
  speaking,
  paused,
  status,
  start,
  stop,
  togglePause,
  rate,
  currentText,
  total,
  position,
  move,
} = useSpeech()
</script>
<template>
  <q-dialog v-model="open">
    <q-card class="accessibility-panel">
      <q-card-section class="panel-heading"
        ><h2>Acessibilidade</h2>
        <q-btn flat round icon="close" aria-label="Fechar acessibilidade" v-close-popup
      /></q-card-section>
      <q-card-section class="preference-list">
        <p>Ajuste a leitura do seu jeito. Suas preferências ficam neste dispositivo.</p>
        <q-toggle
          v-model="settings.largeText"
          label="Aumentar tamanho do texto"
          color="primary"
        />
        <q-toggle
          v-model="settings.contrast"
          label="Reforçar contraste"
          color="primary"
        />
        <q-toggle v-model="settings.dark" label="Modo escuro" color="primary" />
        <q-toggle
          v-model="settings.reducedMotion"
          label="Reduzir movimento"
          color="primary"
        />
        <q-btn
          flat
          no-caps
          icon="restart_alt"
          label="Restaurar preferências"
          @click="reset"
        />
        <section class="speech-section" aria-labelledby="speech-title">
          <h3 id="speech-title">Ouvir esta página</h3>
          <p v-if="supported">Acompanhe o texto enquanto ouve o conteúdo em português.</p>
          <label v-if="supported" class="speech-speed">
            Velocidade da leitura
            <select v-model.number="rate">
              <option :value="0.75">Mais lenta</option>
              <option :value="0.95">Normal</option>
              <option :value="1.2">Mais rápida</option>
            </select>
          </label>
          <p v-if="!supported">A leitura em voz não está disponível neste navegador.</p>
          <div v-else class="speech-actions">
            <q-btn
              v-if="!speaking"
              unelevated
              color="primary"
              no-caps
              icon="play_arrow"
              label="Iniciar leitura"
              @click="start"
            />
            <template v-else>
              <q-btn
                unelevated
                color="primary"
                no-caps
                :icon="paused ? 'play_arrow' : 'pause'"
                :label="paused ? 'Continuar' : 'Pausar'"
                @click="togglePause"
              />
              <q-btn
                outline
                color="primary"
                no-caps
                icon="stop"
                label="Parar"
                @click="stop"
              />
            </template>
          </div>
          <div v-if="currentText" class="speech-transcript">
            <p class="speech-progress">Trecho {{ position }} de {{ total }}</p>
            <p class="speech-excerpt">{{ currentText }}</p>
            <div v-if="speaking" class="speech-actions">
              <q-btn
                flat
                round
                icon="skip_previous"
                aria-label="Trecho anterior"
                :disable="position <= 1"
                @click="move(-1)"
              />
              <q-btn
                flat
                round
                icon="skip_next"
                aria-label="Próximo trecho"
                :disable="position >= total"
                @click="move(1)"
              />
            </div>
          </div>
          <p class="speech-status" role="status">{{ status }}</p>
        </section>
        <router-link to="/acessibilidade" class="text-link" @click="open = false"
          >Conheça os recursos de acessibilidade <q-icon name="arrow_forward"
        /></router-link>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
<style scoped>
.accessibility-panel {
  width: min(460px, calc(100vw - 32px));
  max-height: 90dvh;
  background: var(--surface);
  color: var(--text);
  border-radius: 16px;
}
.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--line);
}
h2 {
  margin: 0;
  font-size: 1.75rem;
}
.preference-list {
  display: grid;
  gap: 10px;
  padding: 24px;
}
p {
  margin: 0 0 8px;
  font-size: 0.875rem;
  color: var(--muted);
}
.speech-section {
  margin-top: 8px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}
h3 {
  font-size: 1.375rem;
  margin: 0 0 16px;
}
.speech-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.speech-speed {
  display: grid;
  gap: 8px;
  margin-block: 16px;
  font-size: 0.875rem;
}
.speech-speed select {
  width: 100%;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
}
.speech-transcript {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
}
.speech-excerpt {
  color: var(--text);
  font-size: 1rem;
  line-height: 1.7;
  overflow-wrap: anywhere;
}
.speech-progress {
  font-size: 0.75rem;
}
.speech-status {
  margin-top: 12px;
}
.text-link {
  font-size: 0.8125rem;
}
</style>
