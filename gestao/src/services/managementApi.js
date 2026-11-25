const apiBase = '/api/v1/management'
const csrfUrl = '/api/v1/auth/csrf'

export class ManagementApiError extends Error {
  constructor(message, code, status, details) {
    super(message)
    this.name = 'ManagementApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

async function readResponse(response) {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = Array.isArray(body.message)
      ? body.message.join(' ')
      : body.message || 'Não foi possível concluir a solicitação.'
    throw new ManagementApiError(message, body.code, response.status, body.details)
  }
  return body
}

async function getCsrfToken() {
  const response = await fetch(csrfUrl, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })
  const body = await readResponse(response)
  return body.data.token
}

async function requestJson(method, path, payload) {
  const headers = { Accept: 'application/json' }
  if (method !== 'GET') {
    headers['X-CSRF-Token'] = await getCsrfToken()
  }
  if (payload !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers,
    credentials: 'include',
    ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
  })
  return readResponse(response)
}

export async function uploadManagementMedia(file, kind) {
  const token = await getCsrfToken()
  const form = new FormData()
  form.append('file', file)
  form.append('kind', kind)
  const response = await fetch(`${apiBase}/media`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'X-CSRF-Token': token,
    },
    credentials: 'include',
    body: form,
  })
  const body = await readResponse(response)
  return body.data
}

export const managementApi = {
  listBoxes: (page = 1, perPage = 100) =>
    requestJson('GET', `/boxes?page=${page}&perPage=${perPage}`),
  createBox: (payload) => requestJson('POST', '/boxes', payload),
  updateBoxRevision: (id, payload) =>
    requestJson('PATCH', `/boxes/${id}/revision`, payload),
  submitBoxReview: (id) => requestJson('POST', `/boxes/${id}/submit-review`, {}),
  approveBox: (id) => requestJson('POST', `/boxes/${id}/approve`, {}),
  returnBox: (id, comment) => requestJson('POST', `/boxes/${id}/return`, { comment }),
  publishBox: (id) => requestJson('POST', `/boxes/${id}/publish`, {}),
  deactivateBox: (id) => requestJson('POST', `/boxes/${id}/deactivate`, {}),
  reactivateBox: (id) => requestJson('POST', `/boxes/${id}/reactivate`, {}),

  listProducts: (page = 1, perPage = 100) =>
    requestJson('GET', `/products?page=${page}&perPage=${perPage}`),
  createProduct: (payload) => requestJson('POST', '/products', payload),
  updateProductRevision: (id, payload) =>
    requestJson('PATCH', `/products/${id}/revision`, payload),
  submitProductReview: (id) => requestJson('POST', `/products/${id}/submit-review`, {}),
  approveProduct: (id) => requestJson('POST', `/products/${id}/approve`, {}),
  returnProduct: (id, comment) =>
    requestJson('POST', `/products/${id}/return`, { comment }),
  publishProduct: (id) => requestJson('POST', `/products/${id}/publish`, {}),
  deactivateProduct: (id) => requestJson('POST', `/products/${id}/deactivate`, {}),
  reactivateProduct: (id) => requestJson('POST', `/products/${id}/reactivate`, {}),

  listCategories: () => requestJson('GET', '/categories'),
  createCategory: (payload) => requestJson('POST', '/categories', payload),
  updateCategory: (id, payload) => requestJson('PATCH', `/categories/${id}`, payload),
  deactivateCategory: (id) => requestJson('POST', `/categories/${id}/deactivate`, {}),
  activateCategory: (id) => requestJson('POST', `/categories/${id}/activate`, {}),
  deleteCategory: (id) => requestJson('DELETE', `/categories/${id}`),
}
