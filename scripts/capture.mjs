import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const directory = '.impeccable/review'
await mkdir(directory, { recursive: true })
const browser = await chromium.launch()
const checks = []
for (const [name, width, height, route] of [
  ['desktop', 1440, 1000, '/'],
  ['mobile', 390, 844, '/'],
  ['catalog-desktop', 1440, 1000, '/produtos'],
  ['detail-mobile', 390, 844, '/produtos/caneca-serra'],
  ['desktop-dark', 1440, 1000, '/'],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: 'reduce',
  })
  if (name.endsWith('-dark')) {
    await page.addInitScript(() =>
      localStorage.setItem('vitrine:accessibility', JSON.stringify({ dark: true })),
    )
  }
  await page.goto(`http://127.0.0.1:4180${route}`)
  await page.locator('main h1').waitFor()
  await page.evaluate(async () => {
    await document.fonts.ready
    const images = [...document.images]
    for (const image of images) image.loading = 'eager'
    await Promise.all(images.map((image) => image.decode().catch(() => {})))
    window.scrollTo(0, 0)
  })
  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    brokenImages: [...document.images]
      .filter((image) => !image.naturalWidth)
      .map((image) => image.src),
    title: document.title,
  }))
  checks.push({ name, ...metrics })
  await page.screenshot({
    path: `${directory}/${name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  await page.close()
}
await browser.close()
await writeFile(`${directory}/metrics.json`, JSON.stringify(checks, null, 2))
console.log(JSON.stringify(checks, null, 2))
