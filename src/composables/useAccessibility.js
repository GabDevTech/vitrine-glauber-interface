import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { readStorage, writeStorage } from '../utils/storage'

const defaults = { dark: false, contrast: false, largeText: false, reducedMotion: false }
export function useAccessibility() {
  const quasar = useQuasar()
  const stored = readStorage('vitrine:accessibility', defaults)
  const settings = ref({
    ...defaults,
    ...(stored && typeof stored === 'object' ? stored : {}),
  })
  watch(
    settings,
    (value) => {
      quasar.dark.set(Boolean(value.dark))
      const root = document.documentElement
      root.classList.toggle('high-contrast', Boolean(value.contrast))
      root.classList.toggle('large-text', Boolean(value.largeText))
      root.classList.toggle('reduce-motion', Boolean(value.reducedMotion))
      // Controles nativos e a barra do navegador também acompanham o tema.
      root.style.colorScheme = value.dark ? 'dark' : 'light'
      const themeMeta = document.querySelector('meta[name="theme-color"]')
      if (themeMeta) {
        themeMeta.content = getComputedStyle(document.body)
          .getPropertyValue('--paper')
          .trim()
      }
      writeStorage('vitrine:accessibility', value)
    },
    { deep: true, immediate: true },
  )
  const reset = () => {
    settings.value = { ...defaults }
  }
  return { settings, reset }
}
