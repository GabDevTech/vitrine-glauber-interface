const DATABASE = 'vitrine-gestao'
const STORE = 'catalog'

// JSON also unwraps Vue proxies before IndexedDB performs its structured clone.
export function serializeSnapshot(snapshot) {
  return JSON.parse(JSON.stringify(snapshot?.value ?? snapshot))
}

function storageError(cause) {
  return new Error(
    'Não foi possível salvar ou acessar os cadastros neste navegador. Verifique o espaço disponível e tente novamente.',
    { cause },
  )
}

async function openDatabase() {
  if (!globalThis.indexedDB) throw storageError()
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(storageError(request.error))
    request.onblocked = () => reject(storageError())
  })
}

async function transaction(mode, snapshot, expectedRevision = 0) {
  const data = mode === 'readwrite' ? serializeSnapshot(snapshot) : null
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const tx = database.transaction(STORE, mode)
      let result
      let conflict
      const store = tx.objectStore(STORE)
      // Read and compare inside the write transaction: IndexedDB serializes it
      // against write transactions from other tabs before this read runs.
      const request = store.get('snapshot')
      request.onsuccess = () => {
        if (mode === 'readonly') {
          result = request.result
          return
        }
        const currentRevision = request.result?.revision || 0
        if (currentRevision !== expectedRevision) {
          conflict = Object.assign(
            new Error(
              'Os cadastros foram alterados em outra aba. Copie suas alterações e recarregue a página antes de tentar salvar novamente.',
            ),
            { code: 'CATALOG_CONFLICT' },
          )
          tx.abort()
          return
        }
        result = currentRevision + 1
        store.put({ ...data, revision: result }, 'snapshot')
      }
      tx.oncomplete = () => resolve(result)
      tx.onerror = () => reject(conflict || storageError(tx.error))
      tx.onabort = () => reject(conflict || storageError(tx.error))
    })
  } catch (cause) {
    if (cause?.code === 'CATALOG_CONFLICT') throw cause
    throw storageError(cause)
  } finally {
    database.close()
  }
}

export const readCatalogSnapshot = () => transaction('readonly')
export const writeCatalogSnapshot = (snapshot, { expectedRevision = 0 } = {}) =>
  transaction('readwrite', snapshot, expectedRevision)
