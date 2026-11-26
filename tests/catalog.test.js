import test from 'node:test'
import assert from 'node:assert/strict'
import { boxes, categories, products } from '../src/data/catalog.js'
import { filterCatalog, formatPrice, normalizeText } from '../src/utils/catalog.js'
import { readStorage, writeStorage } from '../src/utils/storage.js'

test('busca ignora acentos, caixa e espaços extras', () => {
  assert.equal(normalizeText('  CAFÉ  '), 'cafe')
  assert.deepEqual(
    filterCatalog(products, { query: 'cafe catuai' }).map((p) => p.id),
    [8],
  )
})
test('busca de box encontra um produto vendido por ele', () => {
  assert.deepEqual(
    filterCatalog(boxes, { query: 'caneca' }, boxes, products).map((b) => b.id),
    [1],
  )
})
test('busca de produto encontra o nome do box', () => {
  assert.equal(filterCatalog(products, { query: 'Barro da Serra' }, boxes).length, 2)
})
test('categoria e busca são aplicadas em conjunto', () => {
  assert.equal(
    filterCatalog(products, { query: 'caneca', category: 'moda' }, boxes).length,
    0,
  )
  assert.equal(filterCatalog(products, { category: 'bem-estar' }).length, 1)
})
test('categoria desconhecida mostra lista vazia', () => {
  assert.equal(filterCatalog(boxes, { category: 'inexistente' }).length, 0)
})
test('ordenação por preço não altera dados originais', () => {
  const original = products.map((p) => p.id)
  assert.equal(filterCatalog(products, { sort: 'menor-preco' })[0].price, 16)
  assert.equal(filterCatalog(products, { sort: 'maior-preco' })[0].price, 120)
  assert.deepEqual(
    products.map((p) => p.id),
    original,
  )
})
test('preço zero e preço ausente são diferentes', () => {
  assert.match(formatPrice(0), /0,00/)
  assert.equal(formatPrice(undefined), 'Consulte o expositor')
})
test('catálogo mantém referências e endereços únicos', () => {
  for (const list of [boxes, products]) {
    assert.equal(new Set(list.map((i) => i.id)).size, list.length)
    assert.equal(new Set(list.map((i) => i.slug)).size, list.length)
  }
  for (const p of products) assert.ok(boxes.some((b) => b.id === p.boxId))
  for (const item of [...boxes, ...products])
    assert.ok(categories.some((c) => c.id === item.category))
})
test('armazenamento bloqueado ou corrompido não interrompe navegação', () => {
  const before = globalThis.localStorage
  globalThis.localStorage = {
    getItem() {
      return 'inválido'
    },
    setItem() {
      throw Error('blocked')
    },
  }
  assert.deepEqual(readStorage('key', []), [])
  assert.doesNotThrow(() => writeStorage('key', []))
  globalThis.localStorage = before
})
