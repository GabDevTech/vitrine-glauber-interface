import { ref, computed, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'

export function useSpeech() {
  const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  const speaking = ref(false)
  const paused = ref(false)
  const status = ref('')
  const route = useRoute()
  const chunks = ref([])
  const index = ref(0)
  const rate = ref(0.95)
  const currentText = computed(() => chunks.value[index.value] || '')
  const total = computed(() => chunks.value.length)
  const position = computed(() => (total.value ? index.value + 1 : 0))
  let generation = 0

  function stop() {
    generation += 1
    if (supported) window.speechSynthesis.cancel()
    speaking.value = false
    paused.value = false
    status.value = ''
    chunks.value = []
    index.value = 0
  }
  function next(token) {
    if (token !== generation) return
    if (index.value >= chunks.value.length) {
      index.value = Math.max(0, chunks.value.length - 1)
      speaking.value = false
      paused.value = false
      status.value = 'Leitura concluída.'
      return
    }
    const utterance = new SpeechSynthesisUtterance(currentText.value)
    utterance.lang = 'pt-BR'
    utterance.rate = rate.value
    const voices = window.speechSynthesis.getVoices()
    const voice =
      voices.find((item) => /^pt[-_]BR$/i.test(item.lang)) ||
      voices.find((item) => /^pt\b/i.test(item.lang))
    if (voice) utterance.voice = voice
    status.value = `Lendo trecho ${position.value} de ${total.value}.`
    utterance.onend = () => {
      if (token !== generation) return
      index.value += 1
      next(token)
    }
    utterance.onerror = () => {
      if (token === generation) {
        speaking.value = false
        paused.value = false
        status.value = 'A leitura foi interrompida. Você pode tentar novamente.'
      }
    }
    window.speechSynthesis.speak(utterance)
  }
  function start() {
    if (!supported) return
    stop()
    const elements = document.querySelectorAll(
      '#conteudo-principal :is(h1, h2, h3, h4, p, li, dt, dd)',
    )
    const segmenter =
      typeof Intl.Segmenter === 'function'
        ? new Intl.Segmenter('pt-BR', { granularity: 'sentence' })
        : null
    chunks.value = Array.from(elements)
      .filter(
        (element) =>
          element.checkVisibility() &&
          !element.closest('[aria-hidden="true"], [hidden], [inert]') &&
          !element.parentElement.closest('p, li, dt, dd'),
      )
      .flatMap((element) => {
        const copy = element.cloneNode(true)
        copy
          .querySelectorAll('[aria-hidden="true"], .q-icon, button, script, style')
          .forEach((node) => node.remove())
        copy.querySelectorAll('br').forEach((node) => node.replaceWith(' '))
        const text = copy.textContent.replace(/\s+/g, ' ').trim()
        const sentences = segmenter
          ? [...segmenter.segment(text)].map((part) => part.segment)
          : [text]
        // Keep utterances short enough for mobile speech engines, preserving words.
        return sentences
          .flatMap((sentence) => sentence.match(/.{1,220}(?:\s|$)|\S{1,220}/gu) || [])
          .map((part) => part.trim())
      })
      .filter(Boolean)
    if (!chunks.value.length) {
      status.value = 'Não há texto disponível nesta página.'
      return
    }
    index.value = 0
    speaking.value = true
    next(generation)
  }
  function togglePause() {
    if (!supported || !speaking.value) return
    if (paused.value) window.speechSynthesis.resume()
    else window.speechSynthesis.pause()
    paused.value = !paused.value
    status.value = `${paused.value ? 'Leitura pausada no' : 'Lendo'} trecho ${position.value} de ${total.value}.`
  }
  function move(offset) {
    if (!speaking.value) return
    generation += 1
    window.speechSynthesis.cancel()
    index.value = Math.max(0, Math.min(total.value - 1, index.value + offset))
    paused.value = false
    next(generation)
  }
  watch(rate, () => {
    if (speaking.value) move(0)
  })
  watch(() => route.fullPath, stop)
  onBeforeUnmount(stop)
  return {
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
  }
}
