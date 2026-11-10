import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('erro de carregamento pode ser recuperado sem recarregar a página', async ({
  page,
}) => {
  await page.route('**/src/services/catalogService.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `import { boxes, categories, products } from '/src/data/catalog.js';
      let failed = false;
      export async function fetchCatalog() {
        if (!failed) { failed = true; throw new Error('Falha simulada'); }
        return { boxes, categories, products };
      }`,
    }),
  )
  await page.goto('/boxes')
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar')
  await page.getByRole('button', { name: 'Carregar catálogo' }).click()
  await expect(page.locator('.box-card')).toHaveCount(5)
})

test('tema escuro mantém contraste acessível', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('vitrine:accessibility', JSON.stringify({ dark: true })),
  )
  await page.goto('/')
  await expect(page.locator('body')).toHaveClass(/body--dark/)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(
    results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([])
})

test('buscar produto na entrada leva ao box correspondente', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'O que você quer descobrir?' }).fill('caneca')
  await page.getByRole('button', { name: 'Explorar', exact: true }).click()
  await expect(page).toHaveURL(/boxes\?busca=caneca/)
  await expect(page.locator('.box-card')).toHaveCount(1)
  await expect(page.locator('.box-card')).toContainText('Barro da Serra')
})

test('filtros sobrevivem ao recarregamento e não vazam entre catálogos', async ({
  page,
}) => {
  await page.goto('/produtos?categoria=artesanato&busca=caneca')
  await expect(page.locator('.product-card')).toHaveCount(1)
  await page.reload()
  await expect(page.locator('.product-card')).toHaveCount(1)
  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  await expect(page.locator('.product-card')).toHaveCount(8)
  await page.goto('/boxes')
  await expect(page.locator('.box-card')).toHaveCount(5)
})

test('favoritos podem ser guardados, recuperados e removidos', async ({ page }) => {
  await page.goto('/produtos/caneca-serra')
  await page.getByRole('button', { name: 'Salvar Caneca Serra', exact: true }).click()
  await page.goto('/favoritos')
  await expect(page.locator('.product-card')).toContainText('Caneca Serra')
  await page.reload()
  await expect(page.locator('.product-card')).toHaveCount(1)
  await page.getByRole('button', { name: 'Remover Caneca Serra', exact: true }).click()
  await expect(page.getByText('O que você quer conhecer de perto?')).toBeVisible()
})

test('contato fictício informa a limitação sem abrir conversa', async ({
  page,
  context,
}) => {
  await page.goto('/boxes/barro-da-serra')
  await page.getByRole('button', { name: 'Falar com o expositor' }).click()
  await expect(page.getByRole('status')).toContainText('expositor demonstrativo')
  expect(context.pages()).toHaveLength(1)
})

test('busca sem resultados permite recuperação', async ({ page }) => {
  await page.goto('/boxes?busca=naoexiste')
  await expect(
    page.getByRole('heading', { name: 'Não encontramos esse achado' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Limpar filtros' }).last().click()
  await expect(page.locator('.box-card')).toHaveCount(5)
})

test('ordenar por preço muda a lista', async ({ page }) => {
  await page.goto('/produtos')
  await page.getByLabel('Ordenar por').click()
  await page.getByRole('option', { name: 'Menor preço', exact: true }).click()
  await expect(page.locator('.product-card').first()).toContainText('Sabonete de alecrim')
  await expect(page).toHaveURL(/ordem=menor-preco/)
})

test('tema, contraste e texto maior persistem e podem ser restaurados', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Opções de acessibilidade' }).click()
  await page.getByRole('switch', { name: 'Modo escuro' }).click()
  await page.getByRole('switch', { name: 'Aumentar tamanho do texto' }).click()
  await page.getByRole('switch', { name: 'Reforçar contraste' }).click()
  await expect(page.locator('body')).toHaveClass(/body--dark/)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/large-text/)
  await expect(page.locator('html')).toHaveClass(/high-contrast/)
  await page.getByRole('button', { name: 'Opções de acessibilidade' }).click()
  await page.getByRole('button', { name: 'Restaurar preferências' }).click()
  await expect(page.locator('body')).not.toHaveClass(/body--dark/)
})

test('link de teclado pula o cabeçalho', async ({ page }) => {
  await page.goto('/')
  // O Router carrega a página inicial de forma assíncrona.
  await expect(page.locator('main h1')).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#conteudo-principal')).toBeFocused()
})

for (const width of [360, 390, 768, 1440]) {
  test(`rotas sem erro e sem rolagem horizontal em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    for (const route of [
      '/',
      '/boxes',
      '/produtos',
      '/boxes/barro-da-serra',
      '/produtos/caneca-serra',
      '/favoritos',
      '/visite',
      '/sobre',
      '/acessibilidade',
      '/privacidade',
      '/nao-existe',
    ]) {
      await page.goto(route)
      await expect(page.locator('main h1')).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        route,
      ).toBeTruthy()
    }
    expect(errors).toEqual([])
  })
}

for (const route of ['/', '/boxes', '/produtos/caneca-serra']) {
  test(`acessibilidade automática em ${route}`, async ({ page }) => {
    await page.goto(route)
    await expect(page.locator('main h1')).toBeVisible()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([])
  })
}
