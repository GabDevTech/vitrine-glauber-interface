import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const directory = '.impeccable/review/gestao'
await mkdir(directory, { recursive: true })
const browser = await chromium.launch()
const checks = []
for (const [name, width, height, path] of [
  ['login-desktop', 1440, 1000, 'login'],
  ['login-mobile', 390, 844, 'login'],
  ['dashboard-desktop', 1440, 1000, 'painel'],
  ['dashboard-mobile', 390, 844, 'painel'],
  ['boxes-desktop', 1440, 1000, 'boxes'],
  ['products-mobile', 390, 844, 'produtos'],
  ['reviews-desktop', 1440, 1000, 'revisoes'],
  ['editor-mobile', 390, 844, 'produtos'],
  ['dashboard-dark', 1440, 1000, 'painel'],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: 'reduce',
  })
  await page.addInitScript(
    ({ enter, dark }) => {
      if (enter) sessionStorage.setItem('vitrine:gestao:demo', 'active')
      if (dark) localStorage.setItem('vitrine:gestao:dark', 'true')
    },
    { enter: path !== 'login', dark: name.endsWith('-dark') },
  )
  await page.goto('http://127.0.0.1:4175/gestao/' + path)
  await page.locator('main h1').waitFor()
  if (name === 'editor-mobile') {
    await page.getByRole('button', { name: 'Novo produto', exact: true }).click()
    await page.getByRole('textbox', { name: 'Nome do produto', exact: true }).waitFor()
  }
  await page.evaluate(async () => {
    await document.fonts.ready
    for (const image of document.images) image.loading = 'eager'
    await Promise.all([...document.images].map((image) => image.decode().catch(() => {})))
    window.scrollTo(0, 0)
  })
  checks.push(
    await page.evaluate(
      (name) => ({
        name,
        overflow: document.documentElement.scrollWidth > innerWidth,
        brokenImages: [...document.images]
          .filter((image) => !image.naturalWidth)
          .map((image) => image.src),
      }),
      name,
    ),
  )
  await page.screenshot({
    path: directory + '/' + name + '.png',
    fullPage: name !== 'editor-mobile',
    animations: 'disabled',
  })
  await page.close()
}
await browser.close()
await writeFile(directory + '/metrics.json', JSON.stringify(checks, null, 2))
console.log(JSON.stringify(checks))
