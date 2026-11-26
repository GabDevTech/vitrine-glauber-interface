import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useManagementCatalog } from '../src/stores/catalog.js'
import {
  mapApiBox,
  mapApiCategory,
  mapApiProduct,
} from '../src/services/catalogService.js'
import { buildActionConfirmation } from '../src/utils/records.js'

function mockJsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

test('carrega boxes, produtos e categorias da API e mapeia status inativado', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url) => {
    const target = String(url)
    if (target.includes('/management/categories')) {
      return mockJsonResponse({
        data: [
          {
            id: '1',
            code: 'artesanato',
            name: 'Artesanato',
            description: 'Peças locais',
            active: true,
            version: 1,
          },
        ],
      })
    }
    if (target.includes('/management/boxes')) {
      return mockJsonResponse({
        data: [
          {
            id: '10',
            boxNumber: 12,
            status: 'published',
            version: 2,
            publishedRevision: {
              id: '100',
              number: 1,
              version: 1,
              status: 'published',
              name: 'Barro da Serra',
              slug: 'barro-da-serra',
              ownerName: 'Ana',
              boxNumber: 12,
              coverMediaId: '50',
              categoryIds: ['1'],
              categories: [
                { id: '1', code: 'artesanato', name: 'Artesanato', active: true },
              ],
            },
            workingRevision: null,
          },
        ],
      })
    }
    if (target.includes('/management/products')) {
      return mockJsonResponse({
        data: [
          {
            id: '20',
            status: 'inactive',
            version: 3,
            publishedRevision: {
              id: '200',
              number: 1,
              version: 1,
              status: 'published',
              name: 'Jarra de Barro',
              slug: 'jarra-de-barro',
              boxId: '10',
              categoryId: '1',
              priceCents: 4500,
              media: [{ mediaId: '51', position: 1, isCover: true }],
            },
            workingRevision: null,
          },
        ],
      })
    }
    return mockJsonResponse({ message: 'Not found' }, 404)
  }

  try {
    setActivePinia(createPinia())
    const store = useManagementCatalog()
    await store.load({ force: true })
    assert.equal(store.categories.length, 1)
    assert.equal(store.boxes.length, 1)
    assert.equal(store.boxes[0].status, 'publicado')
    assert.equal(store.boxes[0].image, '/api/v1/management/media/50')
    const product = store.records.find((r) => r.kind === 'product')
    assert.equal(product.contentStatus, 'inactive')
    assert.equal(product.status, 'rascunho')
    assert.equal(product.price, 45)
    assert.equal(product.boxName, 'Barro da Serra')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('inativar, reativar e gerenciar categorias chamam a API com CSRF', async () => {
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, options = {}) => {
    const target = String(url)
    calls.push({ method: options.method || 'GET', url: target, headers: options.headers })
    if (target.includes('/auth/csrf')) {
      return mockJsonResponse({ data: { token: 'csrf_test_token' } })
    }
    if (target.includes('/management/boxes/10/deactivate')) {
      return mockJsonResponse({
        data: {
          id: '10',
          boxNumber: 12,
          status: 'inactive',
          version: 3,
          publishedRevision: { id: '100', name: 'Barro da Serra', categories: [] },
          workingRevision: null,
        },
      })
    }
    if (target.includes('/management/boxes/10/reactivate')) {
      return mockJsonResponse({
        data: {
          id: '10',
          boxNumber: 12,
          status: 'unpublished',
          version: 4,
          publishedRevision: { id: '100', name: 'Barro da Serra', categories: [] },
          workingRevision: null,
        },
      })
    }
    if (target.includes('/management/categories') && options.method === 'POST') {
      return mockJsonResponse({
        data: {
          id: '2',
          code: 'ceramica',
          name: 'Cerâmica',
          active: true,
          version: 1,
        },
      })
    }
    return mockJsonResponse({ data: [] })
  }

  try {
    setActivePinia(createPinia())
    const store = useManagementCatalog()
    store.records = [
      mapApiBox({
        id: '10',
        boxNumber: 12,
        status: 'published',
        version: 2,
        publishedRevision: { id: '100', name: 'Barro da Serra', categories: [] },
        workingRevision: null,
      }),
    ]
    const deactivated = await store.deactivate(store.records[0])
    assert.equal(deactivated.contentStatus, 'inactive')
    const reactivated = await store.reactivate(deactivated)
    assert.equal(reactivated.status, 'rascunho')
    const createdCat = await store.createCategory({ name: 'Cerâmica' })
    assert.equal(createdCat.code, 'ceramica')
    const mutations = calls.filter((c) => c.method === 'POST')
    assert.equal(mutations.length, 3)
    assert.ok(mutations.every((c) => c.headers['X-CSRF-Token'] === 'csrf_test_token'))
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('mapApiCategory e mapApiProduct preservam IDs e preços nulos', () => {
  const cat = mapApiCategory({
    id: '9',
    code: 'doces',
    name: 'Doces',
    active: true,
    version: 1,
  })
  const prod = mapApiProduct(
    {
      id: '30',
      status: 'unpublished',
      version: 1,
      workingRevision: {
        id: '300',
        status: 'draft',
        name: 'Cocada',
        priceCents: null,
        categoryId: '9',
        media: [],
      },
    },
    new Map([['9', cat]]),
  )
  assert.equal(prod.price, null)
  assert.equal(prod.category, 'doces')
  assert.equal(prod.status, 'rascunho')
})

test('removeBox envia DELETE com CSRF e remove o box e produtos vinculados em cascata', async () => {
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, options = {}) => {
    const target = String(url)
    calls.push({ method: options.method || 'GET', url: target, headers: options.headers })
    if (target.includes('/auth/csrf')) {
      return mockJsonResponse({ data: { token: 'csrf_test_token' } })
    }
    if (target.includes('/management/boxes/10') && options.method === 'DELETE') {
      return mockJsonResponse({
        data: { deleted: true, id: '10', deletedProductIds: ['20'] },
      })
    }
    return mockJsonResponse({ message: 'Not found' }, 404)
  }

  try {
    setActivePinia(createPinia())
    const store = useManagementCatalog()
    const categoriesMap = new Map([
      [
        '1',
        mapApiCategory({
          id: '1',
          code: 'artesanato',
          name: 'Artesanato',
          active: true,
          version: 1,
        }),
      ],
    ])
    store.categories = [...categoriesMap.values()]
    const box10 = mapApiBox({
      id: '10',
      boxNumber: 12,
      status: 'inactive',
      version: 2,
      publishedRevision: { id: '100', name: 'Barro da Serra', categories: [] },
      workingRevision: null,
    })
    const box11 = mapApiBox({
      id: '11',
      boxNumber: 13,
      status: 'published',
      version: 1,
      publishedRevision: { id: '101', name: 'Trama Viva', categories: [] },
      workingRevision: null,
    })
    const prod20 = mapApiProduct(
      {
        id: '20',
        status: 'inactive',
        version: 1,
        publishedRevision: {
          id: '200',
          name: 'Jarra de Barro',
          boxId: '10',
          categoryId: '1',
          media: [],
        },
        workingRevision: null,
      },
      categoriesMap,
    )
    const prod21 = mapApiProduct(
      {
        id: '21',
        status: 'unpublished',
        version: 1,
        workingRevision: {
          id: '201',
          status: 'draft',
          name: 'Vaso Novo',
          boxId: '10',
          categoryId: '1',
          media: [],
        },
      },
      categoriesMap,
    )
    const prod22 = mapApiProduct(
      {
        id: '22',
        status: 'published',
        version: 1,
        publishedRevision: {
          id: '202',
          name: 'Bolsa Trama',
          boxId: '11',
          categoryId: '1',
          media: [],
        },
        workingRevision: null,
      },
      categoriesMap,
    )
    store.records = [box10, box11, prod20, prod21, prod22]

    const result = await store.removeBox(box10)
    assert.deepEqual(result, { deleted: true, id: '10', deletedProductIds: ['20'] })
    assert.deepEqual(
      store.records.map((r) => `${r.kind}:${r.apiId}`),
      ['box:11', 'product:22'],
    )
    assert.equal(store.boxes.length, 1)
    assert.equal(store.boxes[0].apiId, '11')

    const deleteCall = calls.find((c) => c.method === 'DELETE')
    assert.ok(deleteCall)
    assert.ok(deleteCall.url.endsWith('/api/v1/management/boxes/10'))
    assert.equal(deleteCall.headers['X-CSRF-Token'], 'csrf_test_token')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('buildActionConfirmation gera textos e ações esperadas para inativar, reativar e excluir', () => {
  const box = { kind: 'box', name: 'Barro da Serra' }
  const product = { kind: 'product', name: 'Caneca Serra' }

  const deactivateBox = buildActionConfirmation('deactivate', box)
  assert.equal(deactivateBox.title, 'Inativar box?')
  assert.match(
    deactivateBox.message,
    /«Barro da Serra» será inativado e retirado da vitrine pública\./,
  )
  assert.match(deactivateBox.message, /produtos vinculados/)
  assert.equal(deactivateBox.confirmLabel, 'Inativar')
  assert.equal(deactivateBox.confirmColor, 'negative')

  const deactivateProduct = buildActionConfirmation('deactivate', product)
  assert.equal(deactivateProduct.title, 'Inativar produto?')
  assert.equal(
    deactivateProduct.message,
    '«Caneca Serra» será inativado e retirado da vitrine pública.',
  )

  const reactivateProduct = buildActionConfirmation('reactivate', product)
  assert.equal(reactivateProduct.title, 'Reativar produto?')
  assert.equal(
    reactivateProduct.message,
    '«Caneca Serra» será reativado e publicado novamente na vitrine pública.',
  )
  assert.equal(reactivateProduct.confirmLabel, 'Reativar')
  assert.equal(reactivateProduct.confirmColor, 'positive')
  assert.equal(reactivateProduct.confirmTextColor, 'white')

  const deleteBox = buildActionConfirmation('delete', box)
  assert.equal(deleteBox.title, 'Excluir box definitivamente?')
  assert.equal(
    deleteBox.message,
    'Tem certeza de que deseja excluir permanentemente o box «Barro da Serra» e seus produtos vinculados? Esta ação remove o cadastro do banco de dados, da gestão e da vitrine pública e não pode ser desfeita.',
  )
  assert.equal(deleteBox.confirmLabel, 'Excluir definitivamente')
  assert.equal(deleteBox.confirmColor, 'negative')
})
