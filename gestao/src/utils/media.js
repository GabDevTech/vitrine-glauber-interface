export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const MAX_IMAGE_SIDE = 1600
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validateImageFile(file) {
  if (!file || !TYPES.includes(file.type))
    throw new Error('Escolha uma imagem JPG, PNG ou WebP.')
  if (!file.size || file.size > MAX_IMAGE_BYTES)
    throw new Error('Cada foto deve ter até 8 MB.')
}

export function imageDimensions(width, height) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1 ||
    width > 16000 ||
    height > 16000 ||
    width * height > 40000000
  )
    throw new Error('A imagem possui dimensões inválidas ou muito grandes.')
  const ratio = Math.min(1, MAX_IMAGE_SIDE / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

export function isImageDataUrl(value) {
  return (
    typeof value === 'string' &&
    /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  )
}

export async function validateImageSignature(file) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const matches =
    file.type === 'image/jpeg'
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : file.type === 'image/png'
        ? [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
        : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
          String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  if (!matches)
    throw new Error(
      'O conteúdo do arquivo não corresponde a uma imagem JPG, PNG ou WebP válida.',
    )
}

async function decodeImage(file) {
  if (globalThis.createImageBitmap) return createImageBitmap(file)
  const url = URL.createObjectURL(file)
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () =>
        reject(
          new Error('Não foi possível abrir a imagem. O arquivo pode estar inválido.'),
        )
      image.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function prepareImage(file) {
  validateImageFile(file)
  let decoded
  try {
    await validateImageSignature(file)
    decoded = await decodeImage(file)
    const dimensions = imageDimensions(decoded.width, decoded.height)
    const canvas = document.createElement('canvas')
    Object.assign(canvas, dimensions)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível preparar a foto neste navegador.')
    context.drawImage(decoded, 0, 0, dimensions.width, dimensions.height)
    let result = canvas.toDataURL('image/webp', 0.85)
    if (!result.startsWith('data:image/webp;'))
      result = canvas.toDataURL('image/jpeg', 0.85)
    if (!isImageDataUrl(result))
      throw new Error('Não foi possível preparar a foto neste navegador.')
    return result
  } catch (cause) {
    throw new Error(
      cause?.message?.startsWith('A imagem')
        ? cause.message
        : 'Não foi possível abrir a imagem. Escolha um arquivo JPG, PNG ou WebP válido.',
      { cause },
    )
  } finally {
    decoded?.close?.()
  }
}
