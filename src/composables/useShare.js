import { useQuasar } from 'quasar'

export function useShare() {
  const $q = useQuasar()
  async function share({ title, text, url = window.location.href }) {
    try {
      if (navigator.share) await navigator.share({ title, text, url })
      else {
        await navigator.clipboard.writeText(url)
        $q.notify({
          type: 'positive',
          message: 'Link copiado para a área de transferência.',
        })
      }
    } catch (error) {
      if (error?.name !== 'AbortError')
        $q.notify({ type: 'negative', message: 'Não foi possível compartilhar o link.' })
    }
  }
  return { share }
}
