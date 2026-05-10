import { useState } from 'react'
import { api } from '../api'
import { DEFAULT_SITE_CONFIG } from '@mynav/shared/siteConfig'

export function useSiteSettings({ token, siteConfig, setSiteConfig, closeModal }) {
  const [siteForm, setSiteForm] = useState(DEFAULT_SITE_CONFIG)

  const openSiteSettings = (openModal) => {
    setSiteForm(siteConfig)
    openModal('site')
  }

  const saveSiteConfig = async (event) => {
    event.preventDefault()
    const data = await api.updateSiteConfig(token, siteForm)
    setSiteConfig(data)
    closeModal()
  }

  return {
    siteForm,
    setSiteForm,
    openSiteSettings,
    saveSiteConfig
  }
}
