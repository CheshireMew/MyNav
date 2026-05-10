import { useCallback, useState } from 'react'
import { api } from '../api'
import { DEFAULT_SITE_CONFIG } from '@mynav/shared/siteConfig'

export function usePublicData() {
  const [links, setLinks] = useState([])
  const [categories, setCategories] = useState([])
  const [menuLinks, setMenuLinks] = useState([])
  const [siteConfig, setSiteConfig] = useState(DEFAULT_SITE_CONFIG)
  const [loginPath, setLoginPath] = useState('')
  const [search, setSearch] = useState('')

  const refreshNavigationData = useCallback(async () => {
    const [categoryData, menuData, loginPathData, siteData] = await Promise.all([
      api.listCategories(),
      api.listMenuLinks(),
      api.getLoginPath(),
      api.getSiteConfig()
    ])
    setCategories(categoryData)
    setMenuLinks(menuData)
    setLoginPath(loginPathData.login_path)
    setSiteConfig(siteData)
  }, [])

  const refreshLinks = useCallback(async () => {
    setLinks(await api.listLinks(search))
  }, [search])

  const refreshPublicData = useCallback(async () => {
    await Promise.all([
      refreshNavigationData(),
      refreshLinks()
    ])
  }, [refreshNavigationData, refreshLinks])

  const refreshCategories = useCallback(async () => {
    setCategories(await api.listCategories())
  }, [])

  const refreshMenuLinks = useCallback(async () => {
    setMenuLinks(await api.listMenuLinks())
  }, [])

  return {
    links,
    categories,
    menuLinks,
    siteConfig,
    loginPath,
    search,
    setSearch,
    setSiteConfig,
    refreshNavigationData,
    refreshPublicData,
    refreshLinks,
    refreshCategories,
    refreshMenuLinks
  }
}
