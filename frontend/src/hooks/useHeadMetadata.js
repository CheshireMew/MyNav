import { useEffect } from 'react'

export function useHeadMetadata(siteConfig) {
  useEffect(() => {
    if (siteConfig.pageTitle) document.title = siteConfig.pageTitle
    setHeadMeta('description', siteConfig.pageDescription)
    setFavicon(siteConfig.pageIcon)
  }, [siteConfig])
}

function setHeadMeta(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = name
    document.head.appendChild(meta)
  }
  meta.content = content || ''
}

function setFavicon(value) {
  if (!value) return
  let link = document.querySelector("link[rel~='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = value
}
