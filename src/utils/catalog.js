export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}
export function formatPrice(value) {
  return Number.isSafeInteger(value) && value >= 0
    ? `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100)}R$`
    : 'Consulte o expositor'
}

const priceCents = (item) =>
  Number.isSafeInteger(item.priceCents)
    ? item.priceCents
    : typeof item.price === 'number'
      ? Math.round(item.price * 100)
      : null
// Função pura: devolve uma lista nova sem alterar os dados recebidos.
export function filterCatalog(
  items,
  { query = '', category = 'todos', sort = 'destaques' } = {},
  boxes = [],
  products = [],
) {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean)
  const result = items.filter((item) => {
    if (
      category !== 'todos' &&
      !(item.categoryCodes || [item.category]).includes(category)
    )
      return false
    const owner = boxes.find((box) => box.id === item.boxId)
    const relatedProducts = products
      .filter((product) => product.boxId === item.id)
      .map((product) => product.name)
      .join(' ')
    const text = normalizeText(
      [
        item.name,
        item.owner,
        item.description,
        item.categoryLabel,
        owner?.name,
        relatedProducts,
      ].join(' '),
    )
    return terms.every((term) => text.includes(term))
  })
  if (sort === 'nome') result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  if (sort === 'menor-preco')
    result.sort((a, b) => (priceCents(a) ?? Infinity) - (priceCents(b) ?? Infinity))
  if (sort === 'maior-preco')
    result.sort((a, b) => (priceCents(b) ?? -Infinity) - (priceCents(a) ?? -Infinity))
  return result
}
