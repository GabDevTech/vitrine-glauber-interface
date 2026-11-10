import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchCatalog } from '../src/services/catalogService.js'
import { filterCatalog, formatPrice } from '../src/utils/catalog.js'

test('catálogo público adapta IDs, categorias, mídia e centavos', async () => {
  const originalFetch = globalThis.fetch
  const calls = []
  const category = {
    id: '20',
    code: 'artesanato',
    name: 'Artesanato',
    icon: 'palette',
    tone: 'blue',
  }
  const secondCategory = {
    id: '21',
    code: 'moda',
    name: 'Moda',
    icon: 'checkroom',
    tone: 'red',
  }
  globalThis.fetch = async (url) => {
    calls.push(url)
    const resource = new URL(url, 'http://localhost').pathname.split('/').at(-1)
    const page = Number(new URL(url, 'http://localhost').searchParams.get('page'))
    const data =
      resource === 'categories'
        ? [category, secondCategory]
        : resource === 'boxes'
          ? page === 1
            ? [
                {
                  id: '9007199254740993',
                  slug: 'barro-da-serra',
                  name: 'Barro da Serra',
                  ownerName: 'Maria',
                  boxNumber: 8,
                  categories: [category, secondCategory],
                  cover: { url: '/api/v1/media/4' },
                },
              ]
            : []
          : page === 1
            ? [
                {
                  id: '9007199254740994',
                  slug: 'caneca-serra',
                  name: 'Caneca Serra',
                  box: { id: '9007199254740993' },
                  category,
                  priceCents: 2590,
                  cover: { url: '/api/v1/media/5' },
                },
              ]
            : []
    return {
      ok: true,
      json: async () => ({
        data,
        meta: { totalPages: resource === 'categories' ? 1 : 2 },
      }),
    }
  }
  try {
    const catalog = await fetchCatalog()
    assert.equal(calls.length, 5)
    assert.deepEqual(catalog.boxes[0].categoryCodes, ['artesanato', 'moda'])
    assert.equal(catalog.boxes[0].number, 'Box 08')
    assert.equal(catalog.products[0].boxId, catalog.boxes[0].id)
    assert.equal(catalog.products[0].image, '/api/v1/media/5')
    assert.equal(formatPrice(catalog.products[0].priceCents), '25,90R$')
    assert.equal(filterCatalog(catalog.boxes, { category: 'artesanato' }).length, 1)
    assert.equal(filterCatalog(catalog.boxes, { category: 'moda' }).length, 1)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('falha da API rejeita o catálogo', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({ ok: false, status: 503 })
  try {
    await assert.rejects(fetchCatalog(), /Falha ao consultar/)
  } finally {
    globalThis.fetch = originalFetch
  }
})
