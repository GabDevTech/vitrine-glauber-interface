import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterRecords,
  summarizeRecords,
  validateRecord,
  uniqueSlug,
} from '../src/utils/records.js'

const records = [
  {
    id: 1,
    kind: 'box',
    name: 'Café da Serra',
    category: 'alimentacao',
    status: 'em-revisao',
    slug: 'cafe-da-serra',
  },
  {
    id: 2,
    kind: 'box',
    name: 'Trama',
    category: 'moda',
    status: 'rascunho',
    slug: 'trama',
  },
  {
    id: 1,
    kind: 'product',
    name: 'Caneca',
    category: 'artesanato',
    status: 'pronto',
    boxId: 1,
    slug: 'caneca',
  },
]
const context = {
  boxes: records.filter((item) => item.kind === 'box'),
  categories: [{ id: 'artesanato' }, { id: 'moda' }, { id: 'alimentacao' }],
}

test('limpar busca com null não quebra e busca ignora acentos', () => {
  assert.equal(filterRecords(records, { search: null }).length, 3)
  assert.equal(filterRecords(records, { search: ' cafe ' })[0].name, 'Café da Serra')
})
test('tipo, categoria e status podem ser combinados', () => {
  assert.deepEqual(
    filterRecords(records, { kind: 'box', category: 'moda', status: 'rascunho' }).map(
      (item) => item.id,
    ),
    [2],
  )
  assert.equal(filterRecords(records, { status: 'inexistente' }).length, 0)
})
test('contagens são calculadas a partir dos mesmos registros', () => {
  assert.deepEqual(summarizeRecords(records), {
    boxes: 2,
    products: 1,
    review: 1,
    ready: 1,
    draft: 1,
    published: 0,
  })
  assert.equal(summarizeRecords([]).boxes, 0)
})
test('nome vazio e categoria/status inválidos são rejeitados', () => {
  const errors = validateRecord(
    { kind: 'box', name: ' ', category: 'x', status: 'x' },
    context,
  )
  assert.ok(errors.name)
  assert.ok(errors.category)
  assert.ok(errors.status)
})
test('produto exige box existente e preço válido', () => {
  const errors = validateRecord(
    {
      kind: 'product',
      name: 'Peça',
      category: 'artesanato',
      status: 'rascunho',
      boxId: 999,
      price: -1,
    },
    context,
  )
  assert.ok(errors.boxId)
  assert.ok(errors.price)
  assert.deepEqual(
    validateRecord(
      {
        kind: 'product',
        name: 'Peça',
        category: 'artesanato',
        status: 'rascunho',
        boxId: 1,
        price: 0,
      },
      context,
    ),
    {},
  )
})
test('endereços novos não colidem com os existentes', () => {
  assert.equal(uniqueSlug('Café da Serra', records), 'cafe-da-serra-2')
  assert.equal(uniqueSlug('Nova peça', records), 'nova-peca')
})
