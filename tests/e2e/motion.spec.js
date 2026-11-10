import { test, expect } from '@playwright/test'

test('preferência do site reduz movimento e rolagem suave', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() =>
    localStorage.setItem(
      'vitrine:accessibility',
      JSON.stringify({ reducedMotion: true }),
    ),
  )
  await page.goto('/')
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto')
  const duration = await page
    .locator('.hero-picture > img')
    .evaluate((element) => parseFloat(getComputedStyle(element).animationDuration))
  expect(duration).toBeLessThanOrEqual(0.001)
})

test('títulos de visita e favoritos usam entrelinha proporcional', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('vitrine:favorites', JSON.stringify(['box:1'])),
  )
  for (const [route, selector] of [
    ['/visite', '.visit-checklist h2'],
    ['/favoritos', '.visit-saved h2'],
  ]) {
    await page.goto(route)
    await expect(page.locator(selector)).toBeVisible()
    const ratio = await page.locator(selector).evaluate((element) => {
      const style = getComputedStyle(element)
      return parseFloat(style.lineHeight) / parseFloat(style.fontSize)
    })
    expect(ratio).toBeLessThanOrEqual(1.25)
  }
})

test('preferência do sistema reduz a animação de abertura', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const duration = await page
    .locator('.hero-picture > img')
    .evaluate((element) => parseFloat(getComputedStyle(element).animationDuration))
  expect(duration).toBeLessThanOrEqual(0.001)
  await expect(
    page.getByRole('textbox', { name: 'O que você quer descobrir?' }),
  ).toBeVisible()
})

test('movimento normal é finito e não impede navegar', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await expect(page.locator('.hero-picture > img')).toHaveCSS(
    'animation-name',
    'window-open',
  )
  const loops = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations === Infinity)
        .length,
  )
  expect(loops).toBe(0)
  await page
    .getByRole('navigation', { name: 'Navegação principal', exact: true })
    .getByRole('link', { name: 'Produtos', exact: true })
    .click()
  await expect(page.locator('main h1')).toHaveText('Achados com a cara de Conquista.')
  await expect(page.locator('.product-card')).toHaveCount(8)
})

test('filtrar não remonta a página nem reinicia sua transição', async ({ page }) => {
  await page.goto('/produtos')
  await page.locator('.route-surface').evaluate((element) => {
    element.dataset.testIdentity = 'original'
  })
  await page.getByRole('button', { name: 'Artesanato', exact: true }).click()
  await expect(page.locator('.product-card')).toHaveCount(2)
  await expect(page.locator('.route-surface')).toHaveAttribute(
    'data-test-identity',
    'original',
  )
})

test('menu mobile fecha por Escape e devolve o foco', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Abrir menu', exact: true })
  await trigger.click()
  const menu = page.getByRole('navigation', { name: 'Menu do site', exact: true })
  await expect(menu).toBeVisible()
  await menu.getByRole('link', { name: 'Produtos', exact: true }).focus()
  await page.keyboard.press('Escape')
  await expect(menu).not.toBeVisible()
  await expect(trigger).toBeFocused()
})
