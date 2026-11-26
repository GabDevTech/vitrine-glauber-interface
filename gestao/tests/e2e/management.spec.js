import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { demoAccess } from '../../src/config/demoAccess'

async function fillLogin(page) {
  await page.getByLabel('Login', { exact: true }).fill(demoAccess.email)
  await page.getByLabel('Senha', { exact: true }).fill(demoAccess.password)
}

test('login exige campos preenchidos, mostra senha e aceita qualquer texto', async ({
  page,
}) => {
  await page.goto('/gestao/login')
  await page.getByRole('button', { name: 'Acessar demonstração', exact: true }).click()
  await expect(
    page.getByText('Preencha este campo.', { exact: true }).first(),
  ).toBeVisible()
  await page.getByLabel('Login', { exact: true }).fill('teste')
  await page.getByLabel('Senha', { exact: true }).fill('senha-incorreta')
  await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click()
  await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Ocultar senha', exact: true }).click()
  await page.getByRole('button', { name: 'Acessar demonstração', exact: true }).click()
  await expect(page.locator('main h1')).toHaveText('Visão geral')
})

test('login animado permite entrar sem esperar a apresentação', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/gestao/login')
  await expect(page.locator('.login-photo')).toHaveCSS(
    'animation-name',
    'login-photo-reveal',
  )
  const infiniteAnimations = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations === Infinity)
        .length,
  )
  expect(infiniteAnimations).toBe(0)
  await fillLogin(page)
  await page
    .getByRole('button', { name: 'Acessar demonstração', exact: true })
    .press('Enter')
  await expect(page.locator('main h1')).toHaveText('Visão geral')
})

test('login respeita movimento reduzido e mantém a marca legível no celular', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/gestao/login')
  await expect(
    page.getByRole('button', { name: 'Acessar demonstração', exact: true }),
  ).toBeInViewport()
  const duration = await page
    .locator('.login-entry')
    .evaluate((element) => parseFloat(getComputedStyle(element).animationDuration))
  expect(duration).toBeLessThanOrEqual(0.001)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy()
})

async function enter(page) {
  await page.goto('/gestao/login')
  await fillLogin(page)
  await page.getByRole('button', { name: 'Acessar demonstração', exact: true }).click()
  await expect(page.locator('main h1')).toHaveText('Visão geral')
}
async function choose(page, name, option) {
  await page.getByLabel(name, { exact: true }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

test('falha de carregamento permite tentar novamente', async ({ page }) => {
  await page.route('**/gestao/src/services/catalogService.js*', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `let failed = false;
      export async function fetchManagementCatalog() {
        if (!failed) { failed = true; throw new Error('Falha simulada'); }
        return { records: [], categories: [] };
      }`,
    }),
  )
  await enter(page)
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar')
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Fila em dia', exact: true }),
  ).toBeVisible()
})

test('navegação mobile abre e fecha ao escolher uma página', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await enter(page)
  const menu = page.getByRole('button', {
    name: 'Abrir navegação da gestão',
    exact: true,
  })
  await menu.click()
  await expect(menu).toHaveAttribute('aria-expanded', 'true')
  await page
    .getByRole('navigation', { name: 'Navegação da gestão', exact: true })
    .getByRole('link', { name: 'Boxes', exact: true })
    .click()
  await expect(page.locator('main h1')).toHaveText('Boxes')
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
})

test('entrada tem campos sem expor as credenciais de demonstração', async ({ page }) => {
  await page.goto('/gestao/boxes')
  await expect(page).toHaveURL(/gestao\/login/)
  await expect(page.locator('input[type="password"]')).toHaveCount(1)
  await expect(page.getByText('Dados para testar', { exact: true })).toHaveCount(0)
  await expect(page.getByText(demoAccess.email, { exact: true })).toHaveCount(0)
  await expect(page.getByText(demoAccess.password, { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Login', { exact: true })).toHaveValue('')
  await fillLogin(page)
  await page.getByRole('button', { name: 'Acessar demonstração' }).click()
  await expect(page.locator('.management-metrics article strong')).toHaveText([
    '5',
    '8',
    '2',
    '1',
  ])
})

test('barra lateral continua aberta ao navegar no desktop', async ({ page }) => {
  await enter(page)
  const nav = page.getByRole('navigation', { name: 'Navegação da gestão', exact: true })
  await nav.getByRole('link', { name: 'Boxes', exact: true }).click()
  await expect(page.locator('main h1')).toHaveText('Boxes')
  await expect(nav).toBeVisible()
  await nav.getByRole('link', { name: 'Produtos', exact: true }).click()
  await expect(page.locator('.record-table tbody tr')).toHaveCount(8)
})

test('busca sem acento, limpeza e filtros combinados funcionam', async ({ page }) => {
  await enter(page)
  await page.goto('/gestao/boxes')
  await page.getByRole('textbox', { name: 'Buscar boxes' }).fill('cafe')
  await expect(page.locator('.record-table tbody tr')).toHaveCount(1)
  await page.locator('.record-filters .q-field__focusable-action').first().click()
  await expect(page.locator('.record-table tbody tr')).toHaveCount(5)
  await choose(page, 'Status', 'Rascunho')
  await expect(page.locator('.record-table tbody tr')).toHaveCount(1)
  await page.reload()
  await expect(page.locator('.record-table tbody tr')).toHaveCount(1)
  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  await expect(page.locator('.record-table tbody tr')).toHaveCount(5)
})

test('novo box persiste no navegador após recarregar', async ({ page }) => {
  await enter(page)
  await page.getByRole('button', { name: 'Novo box', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Nome do box', exact: true })
    .fill('Ateliê de teste')
  await choose(page, 'Categoria', 'Artesanato')
  await page.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect(page.locator('.management-metrics article strong').first()).toHaveText('6')
  await page
    .getByRole('navigation', { name: 'Navegação da gestão', exact: true })
    .getByRole('link', { name: 'Boxes', exact: true })
    .click()
  await expect(page.locator('main h1')).toHaveText('Boxes')
  await page.getByRole('textbox', { name: 'Buscar boxes' }).fill('atelie')
  await expect(page).toHaveURL(/busca=atelie/)
  await expect(page.locator('.record-table tbody tr')).toHaveCount(1)
  await page.reload()
  await expect(page.locator('.record-table tbody tr')).toHaveCount(1)
  await expect(page.locator('.record-table')).toContainText('Ateliê de teste')
})

test('editar altera o registro em memória, sem requisição de publicação', async ({
  page,
}) => {
  const writes = []
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url())
  })
  await enter(page)
  const nav = page.getByRole('navigation', { name: 'Navegação da gestão', exact: true })
  await nav.getByRole('link', { name: 'Boxes', exact: true }).click()
  await expect(page.locator('main h1')).toHaveText('Boxes')
  await page.getByRole('button', { name: 'Editar Barro da Serra', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Nome do box', exact: true })
    .fill('Barro da Serra atualizado')
  await page.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect(page.locator('.record-table')).toContainText('Barro da Serra atualizado')
  expect(writes).toEqual([])
})

test('produto novo exige box e fica vinculado ao cadastro escolhido', async ({
  page,
}) => {
  await enter(page)
  await page.getByRole('button', { name: 'Novo produto', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Nome do produto', exact: true })
    .fill('Produto de teste')
  await choose(page, 'Categoria', 'Artesanato')
  await page.getByRole('button', { name: 'Enviar para revisão', exact: true }).click()
  await expect(page.getByText('Preencha este campo.', { exact: true })).toBeVisible()
  await choose(page, 'Box responsável', 'Barro da Serra')
  await page.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect(page.locator('.management-metrics article strong').nth(1)).toHaveText('9')
  await page
    .getByRole('navigation', { name: 'Navegação da gestão', exact: true })
    .getByRole('link', { name: 'Produtos', exact: true })
    .click()
  await expect(
    page.locator('.record-table tbody tr').filter({ hasText: 'Produto de teste' }),
  ).toContainText('Barro da Serra')
})

test('publicar demonstração atualiza fila e contagem', async ({ page }) => {
  await enter(page)
  await page
    .getByRole('navigation', { name: 'Navegação da gestão', exact: true })
    .getByRole('link', { name: 'Revisões', exact: true })
    .click()
  await expect(page.locator('.record-table tbody tr')).toHaveCount(4)
  await page
    .getByRole('button', { name: 'Publicar Bolsa Caminhos na demonstração', exact: true })
    .click()
  await expect(page.locator('.record-table tbody tr')).toHaveCount(3)
  await page
    .getByRole('navigation', { name: 'Navegação da gestão', exact: true })
    .getByRole('link', { name: 'Visão geral', exact: true })
    .click()
  await expect(page.locator('.management-metrics article strong').last()).toHaveText('0')
})

test('saída limpa a sessão demonstrativa', async ({ page }) => {
  await enter(page)
  await page.getByRole('button', { name: 'Sair da demonstração', exact: true }).click()
  await expect(page).toHaveURL(/gestao\/login/)
  await page.goto('/gestao/produtos')
  await expect(page).toHaveURL(/gestao\/login/)
})

test('teclado pula navegação até o conteúdo', async ({ page }) => {
  await enter(page)
  await page.goto('/gestao/painel')
  await expect(page.locator('main h1')).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Pular para o conteúdo', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#management-content')).toBeFocused()
})

for (const width of [390, 768, 1440]) {
  test(`páginas, formulário e assets sem erro em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await enter(page)
    for (const path of ['painel', 'boxes', 'produtos', 'revisoes']) {
      await page.goto('/gestao/' + path)
      await expect(page.locator('main h1')).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        path,
      ).toBeTruthy()
      const broken = await page.evaluate(async () => {
        for (const image of document.images) image.loading = 'eager'
        await Promise.all(
          [...document.images].map((image) => image.decode().catch(() => {})),
        )
        return [...document.images]
          .filter((image) => !image.naturalWidth)
          .map((image) => image.src)
      })
      expect(broken).toEqual([])
    }
    await page.goto('/gestao/boxes')
    await page.getByRole('button', { name: 'Novo box', exact: true }).click()
    await expect(
      page.getByRole('textbox', { name: 'Nome do box', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('dialog', { name: 'Novo box', exact: true }),
    ).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    ).toBeTruthy()
    expect(errors).toEqual([])
  })
}

for (const target of ['login', 'painel', 'boxes']) {
  test(`acessibilidade automática em ${target}`, async ({ page }) => {
    if (target !== 'login') await enter(page)
    await page.goto('/gestao/' + target)
    await expect(page.locator('main h1')).toBeVisible()
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      result.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
    ).toEqual([])
  })
}

test('tema escuro e preferência persistem', async ({ page }) => {
  await enter(page)
  await page.getByRole('button', { name: 'Ativar tema escuro' }).click()
  await page.reload()
  await expect(page.locator('body')).toHaveClass(/body--dark/)
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(
    result.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => node.target),
    })),
  ).toEqual([])
})
