import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const directory = '.impeccable/review/visual-polish'
await mkdir(directory, { recursive: true })
const browser = await chromium.launch()
const checks = []
const views = [
  ['home-desktop', 1440, 1000, '/'],
  ['home-mobile', 390, 844, '/'],
  ['home-dark', 1440, 1000, '/'],
  ['catalog-desktop', 1440, 1000, '/produtos'],
  ['catalog-mobile', 390, 844, '/boxes'],
  ['box-desktop', 1440, 1000, '/boxes/barro-da-serra'],
  ['product-mobile', 390, 844, '/produtos/caneca-serra'],
  ['visit-mobile', 390, 844, '/visite'],
  ['about-desktop', 1440, 1000, '/sobre'],
  ['favorites-mobile', 390, 844, '/favoritos'],
  ['reading-desktop', 1440, 1000, '/acessibilidade'],
  ['privacy-mobile', 390, 844, '/privacidade'],
]
for (const [name, width, height, route] of views) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: 'reduce',
  })
  await page.addInitScript(
    ({ dark, favorites }) => {
      if (dark)
        localStorage.setItem('vitrine:accessibility', JSON.stringify({ dark: true }))
      if (favorites)
        localStorage.setItem(
          'vitrine:favorites',
          JSON.stringify(['box:1', 'product:1', 'product:8']),
        )
    },
    { dark: name.endsWith('-dark'), favorites: name.startsWith('favorites') },
  )
  await page.goto('http://127.0.0.1:4180' + route)
  await page.locator('main h1').waitFor()
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
    fullPage: true,
    animations: 'disabled',
  })
  await page.close()
}
await browser.close()
await writeFile(directory + '/metrics.json', JSON.stringify(checks, null, 2))
console.log(JSON.stringify(checks))
