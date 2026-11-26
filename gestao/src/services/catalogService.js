import { managementApi } from './managementApi.js'
import { enrichRecords } from '../utils/records.js'

const mediaUrl = (id) => (id ? `/api/v1/management/media/${id}` : '')

function mapStatus(contentStatus, workingStatus) {
  if (workingStatus === 'draft') return 'rascunho'
  if (workingStatus === 'in_review') return 'em-revisao'
  if (workingStatus === 'ready') return 'pronto'
  if (contentStatus === 'published') return 'publicado'
  return 'rascunho'
}

export function mapApiBox(box) {
  const rev = box.workingRevision || box.publishedRevision || {}
  const firstCategory = rev.categories?.[0]
  const coverUrl = mediaUrl(rev.coverMediaId)
  const portraitUrl = mediaUrl(rev.ownerPortraitId)
  return {
    id: Number(box.id),
    apiId: String(box.id),
    kind: 'box',
    slug: rev.slug || '',
    name: rev.name || '',
    owner: rev.ownerName || '',
    number: rev.boxNumber ? `Box ${rev.boxNumber}` : '',
    boxNumber: rev.boxNumber ?? box.boxNumber ?? null,
    location: rev.location || '',
    hours: rev.openingHours || '',
    description: rev.description || '',
    story: rev.story || '',
    whatsapp: rev.whatsapp || '',
    allowPublicContact: Boolean(rev.allowPublicContact),
    category: firstCategory?.code || '',
    categoryId: firstCategory?.id || '',
    categoryIds: rev.categoryIds || [],
    status: mapStatus(box.status, box.workingRevision?.status),
    contentStatus: box.status,
    revisionStatus: box.workingRevision?.status || box.publishedRevision?.status || 'draft',
    version: box.workingRevision ? box.workingRevision.version : box.version,
    boxVersion: box.version,
    coverMediaId: rev.coverMediaId || null,
    ownerPortraitId: rev.ownerPortraitId || null,
    image: coverUrl,
    photos: coverUrl ? [coverUrl] : [],
    ownerPhoto: portraitUrl,
  }
}

export function mapApiProduct(product, categoriesById) {
  const rev = product.workingRevision || product.publishedRevision || {}
  const category = rev.categoryId ? categoriesById.get(String(rev.categoryId)) : null
  const mediaList = rev.media || []
  const photos = mediaList.map((m) => mediaUrl(m.mediaId))
  return {
    id: Number(product.id),
    apiId: String(product.id),
    kind: 'product',
    slug: rev.slug || '',
    name: rev.name || '',
    description: rev.description || '',
    boxId: rev.boxId ? Number(rev.boxId) : null,
    category: category?.id || '',
    categoryId: rev.categoryId ? String(rev.categoryId) : '',
    price: rev.priceCents == null ? null : rev.priceCents / 100,
    priceCents: rev.priceCents ?? null,
    status: mapStatus(product.status, product.workingRevision?.status),
    contentStatus: product.status,
    revisionStatus:
      product.workingRevision?.status || product.publishedRevision?.status || 'draft',
    version: product.workingRevision ? product.workingRevision.version : product.version,
    productVersion: product.version,
    media: mediaList,
    image: photos[0] || '',
    photos,
  }
}

export function mapApiCategory(cat) {
  return {
    id: cat.code,
    apiId: String(cat.id),
    code: cat.code,
    label: cat.name,
    name: cat.name,
    description: cat.description || '',
    icon: cat.icon || '',
    tone: cat.tone || '',
    active: Boolean(cat.active),
    version: cat.version,
  }
}

export async function fetchManagementCatalog() {
  const [boxesRes, productsRes, categoriesRes] = await Promise.all([
    managementApi.listBoxes(1, 100),
    managementApi.listProducts(1, 100),
    managementApi.listCategories(),
  ])
  const categories = (categoriesRes.data || []).map(mapApiCategory)
  const categoriesById = new Map(categories.map((c) => [c.apiId, c]))
  const records = [
    ...(boxesRes.data || []).map(mapApiBox),
    ...(productsRes.data || []).map((p) => mapApiProduct(p, categoriesById)),
  ]
  return {
    revision: Date.now(),
    records: enrichRecords(records, categories),
    categories,
  }
}
