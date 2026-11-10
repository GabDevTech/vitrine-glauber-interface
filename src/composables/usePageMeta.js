import { watchEffect } from 'vue'

export function usePageMeta(source) {
  watchEffect(() => {
    const meta = typeof source === 'function' ? source() : source
    if (!meta) return
    document.title = meta.title ? `${meta.title} | Vitrine Glauber` : 'Vitrine Glauber'
    setMeta(
      'description',
      meta.description ||
        'Descubra boxes, produtos e empreendedores do Centro Cultural Glauber Rocha.',
    )
    setProperty('og:title', document.title)
    setProperty('og:description', meta.description || '')
    setProperty('og:type', 'website')
    setProperty('og:url', window.location.href)
    setProperty(
      'og:image',
      new URL(meta.image || '/images/hero-feira-cultural.webp', window.location.origin)
        .href,
    )
  })
}

function setMeta(name, content) {
  let element = document.head.querySelector(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setProperty(property, content) {
  let element = document.head.querySelector(`meta[property="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}
