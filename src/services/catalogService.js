import { boxes, categories, products } from '../data/catalog'
// Quando existir uma API, substitua apenas esta função por um fetch.
export async function fetchCatalog() {
  return structuredClone({ boxes, categories, products })
}
