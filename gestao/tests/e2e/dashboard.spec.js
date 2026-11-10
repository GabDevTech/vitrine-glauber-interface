import { test, expect } from '@playwright/test'

async function enter(page) {
  await page.goto('/gestao/login')
  await page.getByLabel('Login', { exact: true }).fill('equipe')
  await page.getByLabel('Senha', { exact: true }).fill('teste')
  await page.getByRole('button', { name: 'Acessar demonstração', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'A vitrine por categoria' }),
  ).toBeVisible()
}

test('busca do cabeçalho abre produtos com o filtro informado', async ({ page }) => {
  await enter(page)
  await page.getByLabel('Encontrar produtos', { exact: true }).fill('bolsa')
  await page.getByRole('button', { name: 'Buscar no catálogo de produtos' }).click()
  await expect(page.locator('main h1')).toHaveText('Produtos')
  await expect(
    page.getByRole('textbox', { name: 'Buscar produtos', exact: true }),
  ).toHaveValue('bolsa')
  await expect(page.locator('.record-table tbody tr')).toHaveCount(1)
})

test('resumo por categoria alterna produtos e boxes com dados do catálogo', async ({
  page,
}) => {
  await enter(page)
  await expect(page.locator('.category-chart-summary b')).toHaveText('8')
  await page.getByLabel('Exibir no gráfico', { exact: true }).click()
  await page.getByRole('option', { name: 'Boxes', exact: true }).click()
  await expect(page.locator('.category-chart-summary b')).toHaveText('5')
  await expect(page.locator('.category-chart li')).toHaveCount(4)
})
