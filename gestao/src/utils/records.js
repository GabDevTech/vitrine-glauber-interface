import { normalizeText } from '../../../src/utils/catalog.js'
import { statuses } from '../config/statuses.js'
import { isImageDataUrl } from './media.js'

export function enrichRecords(records, categories) {
  return records.map((record) => ({
    ...record,
    categoryLabel:
      categories.find((category) => category.id === record.category)?.label || '',
    boxName:
      record.kind === 'product'
        ? records.find((box) => box.kind === 'box' && box.id === Number(record.boxId))
            ?.name || ''
        : '',
  }))
}

export function filterRecords(
  records,
  { kind = '', search = '', status = '', category = '', boxId = '' } = {},
) {
  const terms = normalizeText(search ?? '')
    .split(/\s+/)
    .filter(Boolean)
  return records.filter((record) => {
    const text = normalizeText(
      [
        record.name,
        record.owner,
        record.description,
        record.number,
        record.boxName,
        record.category,
        record.categoryLabel,
      ].join(' '),
    )
    return (
      (!kind || record.kind === kind) &&
      (!status || record.status === status) &&
      (!category || record.category === category) &&
      (!boxId || (record.kind === 'product' && Number(record.boxId) === Number(boxId))) &&
      terms.every((term) => text.includes(term))
    )
  })
}
export function summarizeRecords(records) {
  return {
    boxes: records.filter((item) => item.kind === 'box').length,
    products: records.filter((item) => item.kind === 'product').length,
    review: records.filter((item) => item.status === 'em-revisao').length,
    ready: records.filter((item) => item.status === 'pronto').length,
    draft: records.filter((item) => item.status === 'rascunho').length,
    published: records.filter((item) => item.status === 'publicado').length,
  }
}
export function validateRecord(
  record,
  { boxes = [], categories = [], intent, existing } = {},
) {
  const errors = {}
  if (!['box', 'product'].includes(record.kind))
    errors.kind = 'Tipo de cadastro inválido.'
  const name = String(record.name ?? '').trim()
  if (name.length < 2 || name.length > 80)
    errors.name = 'Use um nome com 2 a 80 caracteres.'
  if (String(record.description ?? '').length > 400)
    errors.description = 'Use até 400 caracteres.'
  if (
    (intent !== 'draft' || record.category) &&
    !categories.some((item) => item.id === record.category && item.id !== 'todos')
  )
    errors.category = 'Escolha uma categoria.'
  if (!intent && !statuses.some((item) => item.value === record.status))
    errors.status = 'Escolha um status válido.'
  if (record.kind === 'product') {
    if (
      (intent !== 'draft' || record.boxId) &&
      !boxes.some((item) => item.id === Number(record.boxId))
    )
      errors.boxId = 'Vincule o produto a um box existente.'
    if (
      record.price !== '' &&
      record.price != null &&
      (!Number.isFinite(Number(record.price)) || Number(record.price) < 0)
    )
      errors.price = 'Informe um preço válido, maior ou igual a zero.'
  }
  if (record.photos != null) {
    if (
      !Array.isArray(record.photos) ||
      record.photos.length > 5 ||
      record.photos.some(
        (photo) => !isImageDataUrl(photo) && !existing?.photos?.includes(photo),
      )
    )
      errors.photos = 'Use até 5 fotos JPG, PNG ou WebP preparadas pelo seletor.'
  }
  if (
    record.ownerPhoto &&
    !isImageDataUrl(record.ownerPhoto) &&
    record.ownerPhoto !== existing?.ownerPhoto
  )
    errors.ownerPhoto = 'Escolha uma foto válida do responsável.'
  if (
    intent === 'review' &&
    record.kind === 'product' &&
    !(record.photos ?? existing?.photos ?? []).length
  )
    errors.photos = 'Adicione uma foto do produto antes de enviar à revisão.'
  return errors
}
export function uniqueSlug(name, records) {
  const base =
    normalizeText(name)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'cadastro'
  let slug = base
  let suffix = 2
  while (records.some((item) => item.slug === slug)) slug = `${base}-${suffix++}`
  return slug
}
