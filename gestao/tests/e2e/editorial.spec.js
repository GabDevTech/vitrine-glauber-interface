import { test, expect } from '@playwright/test'
import path from 'node:path'

async function enter(page) {
  await page.goto('/gestao/login')
  await page.getByLabel('Login', { exact: true }).fill('equipe')
  await page.getByLabel('Senha', { exact: true }).fill('teste')
  await page.getByRole('button', { name: 'Acessar demonstração', exact: true }).click()
  await expect(page.locator('main h1')).toHaveText('Visão geral')
}
async function choose(page, label, option) {
  await page.getByLabel(label, { exact: true }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

test('produtos exibem categoria e preço; filtro de box combina com busca', async ({
  page,
}) => {
  await enter(page)
  await page.goto('/gestao/produtos')
  const row = page.locator('.record-table tbody tr').filter({ hasText: 'Caneca Serra' })
  await expect(row).toContainText('Artesanato')
  await expect(row).toContainText('48,00')
  await choose(page, 'Box', 'Barro da Serra')
  await expect(page.locator('.record-table tbody tr')).toHaveCount(2)
  await page.getByLabel('Buscar produtos', { exact: true }).fill('caneca')
  await expect(page.locator('.record-table tbody tr')).toHaveCount(1)
  await page.reload()
  await expect(page.locator('.record-table tbody tr')).toHaveCount(1)
})

test('fechar protege o rascunho e continuar conserva o preenchimento', async ({
  page,
}) => {
  await enter(page)
  await page.getByRole('button', { name: 'Novo box', exact: true }).click()
  await page.getByLabel('Nome do box', { exact: true }).fill('Rascunho protegido')
  await page.getByRole('button', { name: 'Fechar formulário', exact: true }).click()
  await expect(
    page.getByRole('dialog', { name: 'Descartar alterações?', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Continuar editando', exact: true }).click()
  await expect(page.getByLabel('Nome do box', { exact: true })).toHaveValue(
    'Rascunho protegido',
  )
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Descartar alterações', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('foto de produto persiste e publicação exige aprovação; editar reinicia revisão', async ({
  page,
}) => {
  await enter(page)
  await page.getByRole('button', { name: 'Novo produto', exact: true }).click()
  await page.getByLabel('Nome do produto', { exact: true }).fill('Produto fotografado')
  await choose(page, 'Categoria', 'Artesanato')
  await choose(page, 'Box responsável', 'Barro da Serra')
  await page.getByRole('button', { name: 'Enviar para revisão', exact: true }).click()
  await expect(page.locator('.photo-error')).toContainText('pelo menos uma foto')
  await page
    .locator('#product-photo-input')
    .setInputFiles(path.resolve('public/images/catalog/caneca.jpg'))
  await expect(page.locator('.photo-gallery img')).toHaveCount(1)
  await page.getByRole('button', { name: 'Enviar para revisão', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.goto('/gestao/revisoes')
  let row = page
    .locator('.record-table tbody tr')
    .filter({ hasText: 'Produto fotografado' })
  await expect(row).toContainText('Em revisão')
  await expect(row.getByRole('button', { name: /Publicar/ })).toHaveCount(0)
  await page.reload()
  await page
    .getByRole('button', { name: 'Revisar Produto fotografado', exact: true })
    .click()
  await expect(page.locator('.photo-gallery img')).toHaveAttribute('src', /^data:image\//)
  await expect(
    page.getByRole('dialog').getByLabel('Status', { exact: true }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Aprovar revisão', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(row).toContainText('Pronto para publicar')
  await row
    .getByRole('button', {
      name: 'Publicar Produto fotografado na demonstração',
      exact: true,
    })
    .click()
  await expect(row).toHaveCount(0)
  await page.goto('/gestao/produtos')
  await page
    .getByRole('button', { name: 'Editar Produto fotografado', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Aprovar revisão', exact: true }),
  ).toHaveCount(0)
  await page.getByLabel('Nome do produto', { exact: true }).fill('Produto alterado')
  await page.getByRole('button', { name: 'Enviar para revisão', exact: true }).click()
  row = page.locator('.record-table tbody tr').filter({ hasText: 'Produto alterado' })
  await expect(row).toContainText('Em revisão')
})

test('retrato opcional do responsável pode ser salvo, reaberto e removido', async ({
  page,
}) => {
  await enter(page)
  await page.goto('/gestao/boxes')
  await page.getByRole('button', { name: 'Editar Barro da Serra', exact: true }).click()
  await page
    .locator('#owner-photo-input')
    .setInputFiles(path.resolve('public/images/catalog/ceramica.jpg'))
  await expect(page.locator('.photo-gallery img')).toHaveCount(1)
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.reload()
  await page.getByRole('button', { name: 'Editar Barro da Serra', exact: true }).click()
  await expect(page.locator('.photo-gallery img')).toHaveAttribute('src', /^data:image\//)
  await page
    .getByRole('button', { name: 'Remover foto do responsável', exact: true })
    .click()
  await expect(page.locator('.photo-gallery img')).toHaveCount(0)
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('arquivo inválido não vira foto e falha de armazenamento conserva formulário', async ({
  page,
}) => {
  await enter(page)
  await page.getByRole('button', { name: 'Novo produto', exact: true }).click()
  await page.getByLabel('Nome do produto', { exact: true }).fill('Rascunho conservado')
  await page.locator('#product-photo-input').setInputFiles({
    name: 'foto.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('arquivo inválido'),
  })
  await expect(page.locator('.photo-error')).toContainText(/válid|JPG|abrir/)
  await expect(page.locator('.photo-gallery img')).toHaveCount(0)
  await page.evaluate(() =>
    Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }),
  )
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click()
  await expect(page.locator('.form-error')).toContainText('Não foi possível salvar')
  await expect(page.getByLabel('Nome do produto', { exact: true })).toHaveValue(
    'Rascunho conservado',
  )
  await expect(
    page.getByRole('dialog', { name: 'Novo produto', exact: true }),
  ).toBeVisible()
})

test('galeria permite trocar capa e remover fotos sem perder a ordem ao salvar', async ({
  page,
}) => {
  await enter(page)
  await page.getByRole('button', { name: 'Novo produto', exact: true }).click()
  await page.getByLabel('Nome do produto', { exact: true }).fill('Galeria de teste')
  await page
    .locator('#product-photo-input')
    .setInputFiles([
      path.resolve('public/images/catalog/caneca.jpg'),
      path.resolve('public/images/catalog/ceramica.jpg'),
    ])
  await expect(page.locator('.photo-gallery img')).toHaveCount(2)
  const second = await page.locator('.photo-gallery img').nth(1).getAttribute('src')
  await page.getByRole('button', { name: 'Usar foto 2 como capa', exact: true }).click()
  await expect(page.locator('.photo-gallery img').first()).toHaveAttribute('src', second)
  await page.getByRole('button', { name: 'Remover foto 2', exact: true }).click()
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.goto('/gestao/produtos')
  await page.getByRole('button', { name: 'Editar Galeria de teste', exact: true }).click()
  await expect(page.locator('.photo-gallery img')).toHaveCount(1)
  await expect(page.locator('.photo-gallery img')).toHaveAttribute('src', second)
})
