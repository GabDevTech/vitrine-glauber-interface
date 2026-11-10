import { boxes, products, categories } from '../../../src/data/catalog.js'
import { editorialStatus } from '../data/editorialStatus.js'
import { readCatalogSnapshot } from './catalogStorage.js'
import { enrichRecords } from '../utils/records.js'

export async function fetchManagementCatalog() {
  const snapshot = await readCatalogSnapshot()
  if (snapshot)
    return {
      ...snapshot,
      revision: snapshot.revision || 0,
      records: enrichRecords(snapshot.records, snapshot.categories),
    }
  const data = structuredClone({ boxes, products, categories })
  const records = [
    ...data.boxes.map((item) => ({ ...item, kind: 'box' })),
    ...data.products.map((item) => ({ ...item, kind: 'product' })),
  ].map((item) => ({
    ...item,
    image:
      (import.meta.env?.BASE_URL || '/gestao/') + String(item.image).replace(/^\//, ''),
    photos: [
      (import.meta.env?.BASE_URL || '/gestao/') + String(item.image).replace(/^\//, ''),
    ],
    ownerPhoto: '',
    status: editorialStatus[`${item.kind}:${item.id}`] || 'publicado',
  }))
  return {
    revision: 0,
    records: enrichRecords(records, data.categories),
    categories: data.categories.filter((category) => category.id !== 'todos'),
  }
}
