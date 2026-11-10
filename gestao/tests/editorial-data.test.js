import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import { useManagementCatalog } from '../src/stores/catalog.js'
import {
  serializeSnapshot,
  writeCatalogSnapshot,
} from '../src/services/catalogStorage.js'
import {
  imageDimensions,
  validateImageFile,
  validateImageSignature,
  prepareImage,
} from '../src/utils/media.js'
import { filterRecords } from '../src/utils/records.js'

// Minimal IDB boundary double: writes become visible only on transaction complete.
let snapshot, failWrite, completeWrite
function installStorage() {
  snapshot = undefined
  failWrite = false
  completeWrite = undefined
  globalThis.indexedDB = {
    open() {
      const request = {}
      queueMicrotask(() => {
        request.result = {
          close() {},
          transaction(_name, mode) {
            const tx = {
              abort() {
                queueMicrotask(() => tx.onabort())
              },
              objectStore() {
                return {
                  get() {
                    const req = {}
                    queueMicrotask(() => {
                      req.result = snapshot
                      req.onsuccess()
                      if (mode === 'readonly') tx.oncomplete()
                    })
                    return req
                  },
                  put(value) {
                    const req = {}
                    completeWrite = () => {
                      if (failWrite) {
                        tx.error = new Error('quota')
                        tx.onabort()
                        return
                      }
                      snapshot = structuredClone(value)
                      req.onsuccess?.()
                      tx.oncomplete()
                    }
                    return req
                  },
                }
              },
            }
            return tx
          },
        }
        request.onsuccess()
      })
      return request
    },
  }
}
async function finish(promise) {
  // Opening IDB and queued store mutations finish in microtasks before completion.
  for (let i = 0; i < 8; i++) await Promise.resolve()
  assert.equal(typeof completeWrite, 'function')
  const finishWrite = completeWrite
  completeWrite = undefined
  finishWrite()
  return promise
}
async function store() {
  installStorage()
  setActivePinia(createPinia())
  const catalog = useManagementCatalog()
  await catalog.load()
  return catalog
}

test('grava somente após completar transação, fotos sobrevivem reload e clear', async () => {
  const catalog = await store()
  const box = catalog.boxes[0]
  const photo = 'data:image/webp;base64,YWJj'
  const pending = catalog.save({
    ...box,
    name: 'Nome persistido',
    photos: [photo],
    ownerPhoto: photo,
    status: 'publicado',
  })
  assert.notEqual(catalog.boxes[0].name, 'Nome persistido')
  const saved = await finish(pending)
  assert.equal(saved.status, 'rascunho')
  assert.equal(saved.image, photo)
  catalog.clear()
  assert.equal(catalog.records.length, 0)
  await catalog.load()
  assert.equal(catalog.boxes[0].name, 'Nome persistido')
  assert.deepEqual(catalog.boxes[0].photos, [photo])
  assert.equal(catalog.boxes[0].ownerPhoto, photo)
})

test('aprovação exige revisão, publicação relê estado atual e edição invalida aprovação', async () => {
  const catalog = await store()
  let record = catalog.boxes[0]
  await assert.rejects(catalog.publish({ ...record, status: 'pronto' }), /Aprove/)
  record = await finish(
    catalog.save({ ...record, status: 'publicado' }, { intent: 'review' }),
  )
  record = await finish(catalog.approve(record))
  const staleApproved = record
  record = await finish(catalog.publish(record))
  assert.equal(record.status, 'publicado')
  record = await finish(catalog.save({ ...record, name: 'Editado' }))
  assert.equal(record.status, 'rascunho')
  await assert.rejects(catalog.publish(staleApproved), /Aprove/)
  await assert.rejects(catalog.approve(record), /Somente/)
})

test('erro de gravação preserva dados anteriores e não anuncia sucesso', async () => {
  const catalog = await store()
  const record = catalog.boxes[0]
  failWrite = true
  await assert.rejects(
    finish(catalog.save({ ...record, name: 'Não persistido' })),
    /Não foi possível salvar/,
  )
  assert.equal(catalog.boxes[0].name, record.name)
})

test('duas abas não sobrescrevem alterações: revisão é comparada atomicamente', async () => {
  const firstTab = await store()
  setActivePinia(createPinia())
  const secondTab = useManagementCatalog()
  await secondTab.load()
  const firstRecord = firstTab.boxes[0]
  const secondRecord = secondTab.boxes[0]
  await finish(firstTab.save({ ...firstRecord, name: 'Alterado na primeira aba' }))
  assert.equal(snapshot.revision, 1)
  await assert.rejects(
    secondTab.save({ ...secondRecord, name: 'Tentativa na segunda aba' }),
    /Os cadastros foram alterados em outra aba/,
  )
  assert.equal(
    snapshot.records.find((item) => item.kind === 'box' && item.id === firstRecord.id)
      .name,
    'Alterado na primeira aba',
  )
  assert.equal(secondTab.boxes[0].name, secondRecord.name)
  assert.equal(snapshot.revision, 1)
  await finish(firstTab.save({ ...firstTab.boxes[0], name: 'Segunda gravação válida' }))
  assert.equal(snapshot.revision, 2)
  secondTab.clear()
  await secondTab.load()
  await finish(secondTab.save({ ...secondTab.boxes[0], name: 'Recarregou e salvou' }))
  assert.equal(snapshot.revision, 3)
})

test('produto novo exige foto na revisão; galeria limita quantidade e rejeita URL blob', async () => {
  const catalog = await store()
  const input = {
    kind: 'product',
    name: 'Produto',
    category: catalog.categories[0].id,
    boxId: catalog.boxes[0].id,
    photos: [],
  }
  await assert.rejects(catalog.save(input, { intent: 'review' }), (error) =>
    Boolean(error.fields.photos),
  )
  const draft = await finish(catalog.save({ ...input, category: '', boxId: '' }))
  assert.equal(draft.status, 'rascunho')
  await assert.rejects(catalog.save({ ...input, photos: ['blob:fake'] }), (error) =>
    Boolean(error.fields.photos),
  )
  await assert.rejects(
    catalog.save({ ...input, photos: Array(6).fill('data:image/png;base64,YQ==') }),
    (error) => Boolean(error.fields.photos),
  )
})

test('renomear box atualiza nome associado e categoria é enriquecida; filtro box funciona', async () => {
  const catalog = await store()
  const product = catalog.records.find((item) => item.kind === 'product')
  const box = catalog.boxes.find((item) => item.id === product.boxId)
  await finish(catalog.save({ ...box, name: 'Box atualizado' }))
  const updated = catalog.records.find(
    (item) => item === product || (item.kind === 'product' && item.id === product.id),
  )
  assert.equal(updated.boxName, 'Box atualizado')
  assert.equal(
    updated.categoryLabel,
    catalog.categories.find((item) => item.id === updated.category).label,
  )
  assert.ok(
    filterRecords(catalog.records, { boxId: String(box.id) }).every(
      (item) => item.kind === 'product' && item.boxId === box.id,
    ),
  )
})

test('remover todas fotos também remove capa anterior', async () => {
  const catalog = await store()
  const record = await finish(catalog.save({ ...catalog.boxes[0], photos: [] }))
  assert.equal(record.image, '')
})

test('snapshot aceita ref e proxies Vue; storage indisponível rejeita', async () => {
  assert.deepEqual(serializeSnapshot(ref({ records: [{ id: 1 }] })), {
    records: [{ id: 1 }],
  })
  delete globalThis.indexedDB
  await assert.rejects(writeCatalogSnapshot({}), /Não foi possível/)
})

test('mídia valida tipo, tamanho, dimensões e exige decodificação real', async () => {
  assert.throws(() => validateImageFile({ type: 'image/svg+xml', size: 10 }), /JPG/)
  assert.throws(
    () => validateImageFile({ type: 'image/jpeg', size: 8 * 1024 * 1024 + 1 }),
    /8 MB/,
  )
  assert.deepEqual(imageDimensions(3200, 1600), { width: 1600, height: 800 })
  assert.throws(() => imageDimensions(15000, 15000), /dimensões/)
  let decoded = false
  globalThis.createImageBitmap = async () => {
    decoded = true
    throw new Error('invalid bytes')
  }
  const corruptPng = new Blob(
    [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])],
    { type: 'image/png' },
  )
  await assert.rejects(prepareImage(corruptPng), /arquivo JPG, PNG ou WebP válido/)
  assert.equal(decoded, true)
  await assert.rejects(
    validateImageSignature(new Blob(['<svg></svg>'], { type: 'image/png' })),
    /conteúdo do arquivo/,
  )
  delete globalThis.createImageBitmap
})
