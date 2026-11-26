// A interface continua funcionando quando o armazenamento está bloqueado.
export function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}
export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* Preferência permanece nesta visita. */
  }
}
