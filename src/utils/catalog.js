export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}
export function formatPrice(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    : 'Consulte o expositor'
}
// Função pura: devolve uma lista nova sem alterar os dados recebidos.
export function filterCatalog(
  items,
  { query = '', category = 'todos', sort = 'destaques' } = {},
  boxes = [],
  products = [],
) {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean)
  const result = items.filter((item) => {
    if (category !== 'todos' && item.category !== category) return false
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
    result.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
  if (sort === 'maior-preco')
    result.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity))
  return result
}
