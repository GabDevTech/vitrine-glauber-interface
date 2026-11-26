import { test, expect } from '@playwright/test'

for (const width of [320, 360, 390, 700]) {
  test(`banner de login mantém título e legenda separados em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 740 })
    await page.goto('/gestao/login')
    const title = page.locator('.login-art h2')
    const caption = page.locator('.login-art-content > span')
    await expect(title).toHaveText('Mais espaço para quem cria.')
    const headingBox = await title.boundingBox()
    const captionBox = await caption.boundingBox()
    const formBox = await page.locator('.login-copy').boundingBox()
    expect(captionBox.y).toBeGreaterThanOrEqual(headingBox.y + headingBox.height)
    expect(captionBox.y + captionBox.height).toBeLessThanOrEqual(formBox.y)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy()
    await expect(page.getByLabel('Login', { exact: true })).toBeVisible()
  })
}
