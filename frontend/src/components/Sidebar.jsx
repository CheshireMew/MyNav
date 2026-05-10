import { IconView } from './IconView'

export function Sidebar({
  siteConfig,
  tree,
  selectedCat,
  expandedCats,
  token,
  onSelectAll,
  onSelectCategory,
  onToggleCategory,
  onEditCategory,
  onAddLink,
  onAddCategory,
  onManageCategories,
  onManageData,
  onManageMenu,
  onSiteSettings,
  onAdminSettings,
  onLogout
}) {
  return (
    <aside className="sidebar">
      <h2
        className="logo"
        style={{ display: siteConfig.siteLogo ? 'flex' : 'block', alignItems: 'center', gap: '0.5rem' }}
      >
        {siteConfig.siteLogo && <img src={siteConfig.siteLogo} alt="" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />}
        {siteConfig.siteName}
      </h2>
      {siteConfig.siteDescription && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
          {siteConfig.siteDescription}
        </div>
      )}

      <div className={`nav-item ${selectedCat === null ? 'active' : ''}`} onClick={onSelectAll}>
        🌐 全部链接
      </div>

      <div className="sidebar-nav-list" style={{ flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>
        {tree.map(category => (
          <CategoryNavItem
            key={category.id}
            category={category}
            depth={0}
            selectedCat={selectedCat}
            expandedCats={expandedCats}
            token={token}
            onSelectCategory={onSelectCategory}
            onToggleCategory={onToggleCategory}
            onEditCategory={onEditCategory}
          />
        ))}
      </div>

      {token && (
        <div className="sidebar-fixed-actions">
          <div className="nav-item add-link-btn-sidebar" onClick={onAddLink}>➕ 添加链接</div>
          <div className="nav-item add-cat-btn" onClick={onAddCategory}>📂 添加分类</div>
        </div>
      )}

      <div className="sidebar-footer">
        {token && (
          <>
            <button className="icon-btn" title="分类管理" onClick={onManageCategories}>📁</button>
            <button className="icon-btn" title="菜单管理" onClick={onManageMenu}>📋</button>
            <button className="icon-btn" title="数据管理" onClick={onManageData}>💾</button>
            <button className="icon-btn" title="网站设置" onClick={onSiteSettings}>🌐</button>
            <button className="icon-btn" title="管理员设置" onClick={onAdminSettings}>⚙️</button>
            <button className="icon-btn" title="退出登录" onClick={onLogout}>❌</button>
          </>
        )}
      </div>
    </aside>
  )
}

function CategoryNavItem({
  category,
  depth,
  selectedCat,
  expandedCats,
  token,
  onSelectCategory,
  onToggleCategory,
  onEditCategory
}) {
  const hasChildren = category.children.length > 0
  const isExpanded = expandedCats.has(category.id)

  return (
    <div>
      <div
        className={`nav-item ${selectedCat === category.id ? 'active' : ''}`}
        style={{ paddingLeft: `${0.85 + depth * 1.1}rem` }}
        onClick={() => {
          onSelectCategory(category.id)
          if (hasChildren) onToggleCategory(category.id)
        }}
      >
        <span className="cat-icon"><IconView icon={category.icon} /></span>
        <span className="cat-name" style={{ flex: 1 }}>{category.name}</span>
        {hasChildren && (
          <span style={{ fontSize: '0.8rem', opacity: 0.5, transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
            ▶
          </span>
        )}
        {token && (
          <div className="nav-admin-tools">
            <span onClick={(event) => { event.stopPropagation(); onEditCategory(category) }}>✎</span>
          </div>
        )}
      </div>
      {isExpanded && category.children.map(child => (
        <CategoryNavItem
          key={child.id}
          category={child}
          depth={depth + 1}
          selectedCat={selectedCat}
          expandedCats={expandedCats}
          token={token}
          onSelectCategory={onSelectCategory}
          onToggleCategory={onToggleCategory}
          onEditCategory={onEditCategory}
        />
      ))}
    </div>
  )
}
