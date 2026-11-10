const baseUrl = '/api/v1/auth'

export class AuthApiError extends Error {
  constructor(message, code, status) {
    super(message)
    this.name = 'AuthApiError'
    this.code = code
    this.status = status
  }
}

async function readResponse(response) {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = Array.isArray(body.message)
      ? body.message.join(' ')
      : body.message || 'Não foi possível concluir a solicitação.'
    throw new AuthApiError(message, body.code, response.status)
  }
  return body.data
}

async function csrfToken() {
  const response = await fetch(`${baseUrl}/csrf`, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })
  const data = await readResponse(response)
  return data.token
}

async function post(path, data) {
  const token = await csrfToken()
  const response = await fetch(`${baseUrl}/${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-Token': token,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return readResponse(response)
}

export async function login(credentials) {
  return post('login', credentials)
}

export async function currentAccount() {
  const response = await fetch(`${baseUrl}/me`, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })
  if (response.status === 401) return null
  return readResponse(response)
}

export async function logout() {
  return post('logout', {})
}

export async function acceptInvitation(invitation) {
  return post('invitations/accept', invitation)
}
