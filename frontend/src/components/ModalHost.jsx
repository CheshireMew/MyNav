import { AdminSettingsModal } from './modals/AdminSettingsModal'
import { CategoryManagerModal } from './modals/CategoryManagerModal'
import { CategoryModal } from './modals/CategoryModal'
import { DataManagerModal } from './modals/DataManagerModal'
import { LinkModal } from './modals/LinkModal'
import { LoginModal } from './modals/LoginModal'
import { MenuManagerModal } from './modals/MenuManagerModal'
import { SiteSettingsModal } from './modals/SiteSettingsModal'

export function ModalHost({
  activeModal,
  closeModal,
  categories,
  menuLinks,
  loginPath,
  loginForm,
  setLoginForm,
  onLogin,
  links,
  category,
  menu,
  siteSettings,
  adminSettings,
  backup
}) {
  if (activeModal === 'login') {
    return <LoginModal form={loginForm} onChange={setLoginForm} onSubmit={onLogin} />
  }

  if (activeModal === 'link') {
    return (
      <LinkModal
        isEdit={links.isEditingLink}
        targetUrl={links.targetUrl}
        setTargetUrl={links.setTargetUrl}
        previewData={links.previewData}
        setPreviewData={links.setPreviewData}
        categories={categories}
        scraping={links.scraping}
        onScrape={links.scrape}
        onRefresh={links.refreshMetadata}
        onSave={links.saveLink}
        onClose={links.closeLinkModal}
      />
    )
  }

  if (activeModal === 'category') {
    return (
      <CategoryModal
        category={category.editingCategory}
        categories={categories}
        form={category.categoryForm}
        setForm={category.setCategoryForm}
        onSubmit={category.saveCategory}
        onClose={closeModal}
        onClearLinks={category.clearCategoryLinks}
      />
    )
  }

  if (activeModal === 'categoryManager') {
    return (
      <CategoryManagerModal
        categories={categories}
        onClose={closeModal}
        onEdit={category.openEditCategory}
        onDelete={category.deleteCategory}
        onReorder={category.reorderCategory}
      />
    )
  }

  if (activeModal === 'menu') {
    return (
      <MenuManagerModal
        menuLinks={menuLinks}
        form={menu.menuForm}
        setForm={menu.setMenuForm}
        editing={menu.isEditingMenuLink}
        onEdit={menu.editMenuLink}
        onSubmit={menu.saveMenuLink}
        onDelete={menu.deleteMenuLink}
        onReorder={menu.reorderMenuLink}
        onCancelEdit={menu.cancelEditMenuLink}
        onClose={closeModal}
      />
    )
  }

  if (activeModal === 'data') {
    return (
      <DataManagerModal
        onExport={backup.exportData}
        onImport={backup.importData}
        onClose={closeModal}
      />
    )
  }

  if (activeModal === 'site') {
    return (
      <SiteSettingsModal
        form={siteSettings.siteForm}
        setForm={siteSettings.setSiteForm}
        onSubmit={siteSettings.saveSiteConfig}
        onClose={closeModal}
      />
    )
  }

  if (activeModal === 'admin') {
    return (
      <AdminSettingsModal
        form={adminSettings.settingsForm}
        setForm={adminSettings.setSettingsForm}
        loginPath={loginPath}
        onSubmit={adminSettings.saveAdminSettings}
        onClose={closeModal}
      />
    )
  }

  return null
}
