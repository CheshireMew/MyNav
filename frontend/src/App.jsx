import { useEffect, useMemo, useRef, useState } from 'react'
import './index.css'
import { buildCategoryTree } from '@mynav/shared/category'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { CategorySections } from './components/CategorySections'
import { ModalHost } from './components/ModalHost'
import { useAuthSession } from './hooks/useAuthSession'
import { useAdminSettings } from './hooks/useAdminSettings'
import { useBackupActions } from './hooks/useBackupActions'
import { useCategoryActions } from './hooks/useCategoryActions'
import { useHeadMetadata } from './hooks/useHeadMetadata'
import { useLinkActions } from './hooks/useLinkActions'
import { useMenuActions } from './hooks/useMenuActions'
import { usePublicData } from './hooks/usePublicData'
import { useSiteSettings } from './hooks/useSiteSettings'
import { useTheme } from './hooks/useTheme'

function App() {
  const [activeModal, setActiveModal] = useState(null)
  const [selectedCat, setSelectedCat] = useState(null)
  const [expandedCats, setExpandedCats] = useState(new Set())
  const scrollRef = useRef(null)
  const openModal = (name) => setActiveModal(name)
  const closeModal = () => setActiveModal(null)

  const {
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
  } = usePublicData()
  const { token, loginForm, setLoginForm, login, logout } = useAuthSession({ closeModal })
  const { theme, toggleTheme } = useTheme()
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])

  const linksActions = useLinkActions({
    token,
    categories,
    refreshLinks,
    openModal,
    closeModal
  })
  const categoryActions = useCategoryActions({
    token,
    refreshCategories,
    refreshLinks,
    refreshPublicData,
    openModal,
    closeModal
  })
  const menuActions = useMenuActions({ token, refreshMenuLinks })
  const siteSettings = useSiteSettings({
    token,
    siteConfig,
    setSiteConfig,
    closeModal
  })
  const adminSettings = useAdminSettings({
    token,
    refreshPublicData,
    logout,
    closeModal
  })
  const backupActions = useBackupActions({ token, refreshPublicData })

  useHeadMetadata(siteConfig)

  useEffect(() => {
    refreshNavigationData().catch(error => console.error(error))
  }, [refreshNavigationData])

  useEffect(() => {
    refreshLinks().catch(error => console.error(error))
  }, [refreshLinks])

  useEffect(() => {
    const checkHash = () => {
      if (loginPath && window.location.hash === `#${loginPath}`) {
        openModal('login')
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [loginPath])

  const scrollToCategory = (id) => {
    setSelectedCat(id)
    const element = document.getElementById(`cat-${id}`)
    const container = scrollRef.current
    if (!element || !container) return
    const offset = element.getBoundingClientRect().top - container.getBoundingClientRect().top
    container.scrollTo({ top: container.scrollTop + offset - 24, behavior: 'smooth' })
  }

  return (
    <div className="app-container">
      <Sidebar
        siteConfig={siteConfig}
        tree={categoryTree}
        selectedCat={selectedCat}
        expandedCats={expandedCats}
        token={token}
        onSelectAll={() => {
          setSelectedCat(null)
          scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onSelectCategory={scrollToCategory}
        onToggleCategory={(id) => setExpandedCats(previous => toggleSet(previous, id))}
        onEditCategory={categoryActions.openEditCategory}
        onAddLink={linksActions.openAddLink}
        onAddCategory={categoryActions.openAddCategory}
        onManageCategories={() => openModal('categoryManager')}
        onManageData={() => openModal('data')}
        onManageMenu={() => openModal('menu')}
        onSiteSettings={() => siteSettings.openSiteSettings(openModal)}
        onAdminSettings={() => adminSettings.openAdminSettings(openModal)}
        onLogout={logout}
      />
      <div className="main-wrapper">
        <Header
          search={search}
          onSearch={setSearch}
          menuLinks={menuLinks}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="content-scroll" ref={scrollRef}>
          <CategorySections
            tree={categoryTree}
            links={links}
            search={search}
            token={token}
            onEditLink={linksActions.openEditLink}
            onDeleteLink={linksActions.deleteLink}
            onDragStart={linksActions.setDraggedLink}
            onDrop={linksActions.moveLink}
          />
        </main>
      </div>

      <ModalHost
        activeModal={activeModal}
        closeModal={closeModal}
        categories={categories}
        menuLinks={menuLinks}
        loginPath={loginPath}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        onLogin={login}
        links={linksActions}
        category={categoryActions}
        menu={menuActions}
        siteSettings={siteSettings}
        adminSettings={adminSettings}
        backup={backupActions}
      />
    </div>
  )
}

function toggleSet(previous, id) {
  const next = new Set(previous)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

export default App
