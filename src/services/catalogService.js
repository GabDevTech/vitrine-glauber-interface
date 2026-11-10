const pageSize = 100

async function fetchPage(resource, page) {
  const response = await fetch(`/api/v1/${resource}?page=${page}&perPage=${pageSize}`, {
    headers: { Accept: 'application/json' },
    credentials: 'omit',
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error(`Falha ao consultar ${resource}: ${response.status}`)
  const body = await response.json()
  if (!Array.isArray(body.data) || !Number.isInteger(body.meta?.totalPages)) {
    throw new Error(`Resposta inválida de ${resource}`)
  }
  return body
}

async function fetchAll(resource) {
  const first = await fetchPage(resource, 1)
  if (first.meta.totalPages > 100)
    throw new Error('Catálogo acima do limite de carregamento')
  const items = [...first.data]
  for (let page = 2; page <= first.meta.totalPages; page++) {
    const next = await fetchPage(resource, page)
    items.push(...next.data)
  }
  return items
}

function boxFromApi(item) {
  const categoryLabels = item.categories.map((category) => category.name)
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    owner: item.ownerName,
    number:
      item.boxNumber == null ? '' : `Box ${String(item.boxNumber).padStart(2, '0')}`,
    categoryCodes: item.categories.map((category) => category.code),
    categoryLabels,
    categoryLabel: categoryLabels.join(' · '),
    description: item.description,
    story: item.story,
    image: item.cover.url,
    whatsapp: item.whatsapp,
    hours: item.openingHours,
    location: item.location,
  }
}

function productFromApi(item) {
  return {
    id: item.id,
    slug: item.slug,
    boxId: item.box.id,
    name: item.name,
    category: item.category.code,
    categoryLabel: item.category.name,
    priceCents: item.priceCents,
    image: item.cover.url,
    description: item.description,
  }
}

export async function fetchCatalog() {
  const [apiCategories, apiBoxes, apiProducts] = await Promise.all([
    fetchAll('categories'),
    fetchAll('boxes'),
    fetchAll('products'),
  ])
  return {
    categories: [
      { id: 'todos', label: 'Tudo para descobrir', icon: 'grid_view' },
      ...apiCategories.map((item) => ({
        id: item.code,
        label: item.name,
        icon: item.icon,
        tone: item.tone,
        description: item.description,
      })),
    ],
    boxes: apiBoxes.map(boxFromApi),
    products: apiProducts.map(productFromApi),
  }
}
