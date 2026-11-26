import { test, expect } from '@playwright/test'

test('leitura acompanha trechos, ignora texto oculto e cancela eventos antigos', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.spoken = []
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text
      }
    }
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => [{ lang: 'pt-BR', name: 'Português' }],
        cancel() {},
        pause() {},
        resume() {},
        speak(utterance) {
          window.spoken.push(utterance)
        },
      },
    })
  })
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/acessibilidade')
  await expect(page.locator('main h1')).toBeVisible()
  await page.evaluate(() => {
    const fixture = document.createElement('section')
    fixture.innerHTML = '<p hidden>Texto secreto</p><p>Valor R$ 12,50. Visite às 10h.</p>'
    document.querySelector('#conteudo-principal').prepend(fixture)
  })
  await page.getByRole('button', { name: 'Opções de acessibilidade' }).click()
  await page.getByRole('button', { name: 'Iniciar leitura', exact: true }).click()
  await expect(page.locator('.speech-excerpt')).toHaveText('Valor R$ 12,50.')
  await expect(
    page.getByRole('button', { name: 'Trecho anterior', exact: true }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Próximo trecho', exact: true }).click()
  await expect(page.locator('.speech-excerpt')).toHaveText('Visite às 10h.')
  await page.evaluate(() => window.spoken[0].onend())
  await expect(page.locator('.speech-excerpt')).toHaveText('Visite às 10h.')
  await page.getByRole('button', { name: 'Pausar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Continuar', exact: true })).toBeVisible()
  await page.getByLabel('Velocidade da leitura').selectOption('0.75')
  expect(await page.evaluate(() => window.spoken.at(-1).rate)).toBe(0.75)
  await page.getByRole('button', { name: 'Parar', exact: true }).click()
  await page.evaluate(() => window.spoken.at(-1).onend())
  await expect(page.locator('.speech-transcript')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Iniciar leitura', exact: true }),
  ).toBeVisible()
})
