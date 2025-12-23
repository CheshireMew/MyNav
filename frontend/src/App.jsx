import React, { useState, useEffect, useRef } from 'react'
import './index.css'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'

function App() {
  const [links, setLinks] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCat, setSelectedCat] = useState(null)
  const [search, setSearch] = useState('')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [showLogin, setShowLogin] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })

  // Add/Edit Modal state
  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editId, setEditId] = useState(null)
  const [targetUrl, setTargetUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [previewData, setPreviewData] = useState(null)

  // Category Add/Edit state
  const [showCatAdd, setShowCatAdd] = useState(false)
  const [showCatEdit, setShowCatEdit] = useState(false)
  const [showCatManage, setShowCatManage] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [newCat, setNewCat] = useState({ name: '', icon: '', parent_id: '' })

  // Admin Settings state
  const [showSettings, setShowSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState({ username: '', password: '', oldPassword: '', login_path: '' })

  // Top Menu state
  const [menuLinks, setMenuLinks] = useState([])
  const [showMenuManage, setShowMenuManage] = useState(false)
  const [editMenuLink, setEditMenuLink] = useState(null)
  const [menuForm, setMenuForm] = useState({ title: '', url: '', icon: '' })

  // Data Manage state
  const [showDataManage, setShowDataManage] = useState(false)

  const [loginPath, setLoginPath] = useState('')
  // Sidebar expanded state: Set of category IDs
  const [expandedCats, setExpandedCats] = useState(new Set())

  // Site configuration
  const [siteConfig, setSiteConfig] = useState({
    siteName: 'MyNav',
    siteLogo: '',
    siteDescription: '',
    pageTitle: 'MyNav',
    pageDescription: '',
    pageIcon: ''
  })
  const [showSiteSettings, setShowSiteSettings] = useState(false)
  const [siteForm, setSiteForm] = useState({
    siteName: '',
    siteLogo: '',
    siteDescription: '',
    pageTitle: '',
    pageDescription: '',
    pageIcon: ''
  })

  // Drag and drop state
  const [activeId, setActiveId] = useState(null)
  const [overId, setOverId] = useState(null)

  // Helper: render icon (supports image URL or HTML/emoji)
  const renderIcon = (icon) => {
    if (!icon) return null
    if (icon.startsWith('http://') || icon.startsWith('https://')) {
      return <img src={icon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', verticalAlign: 'middle' }} />
    }
    return <span dangerouslySetInnerHTML={{ __html: icon }} />
  }

  const toggleExpand = (catId) => {
    setExpandedCats(prev => {
      const next = new Set(prev)
      if (next.has(catId)) {
        next.delete(catId)
      } else {
        next.add(catId)
      }
      return next
    })
  }

  const API_BASE = 'http://localhost:3001/api'
  const scrollRef = React.useRef(null)

  // Theme Sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  // Update page title and meta description
  useEffect(() => {
    if (siteConfig.pageTitle) {
      document.title = siteConfig.pageTitle
    }

    if (siteConfig.pageDescription) {
      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) {
        metaDesc = document.createElement('meta')
        metaDesc.name = 'description'
        document.head.appendChild(metaDesc)
      }
      metaDesc.content = siteConfig.pageDescription
    }

    if (siteConfig.pageIcon) {
      let link = document.querySelector("link[rel~='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = siteConfig.pageIcon
    }
  }, [siteConfig.pageTitle, siteConfig.pageDescription, siteConfig.pageIcon])

  // Initial Fetch & Hash Monitor
  useEffect(() => {
    fetchCategories()
    fetchLinks()
    fetchMenuLinks()
    fetchLoginPath()
    fetchSiteConfig()

    const checkHash = () => {
      if (window.location.hash === `#${loginPath}`) {
        setShowLogin(true)
        window.history.replaceState(null, null, ' ') // Clear hash without reload
      }
    }
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [search, loginPath])

  const fetchLoginPath = async () => {
    try {
      const res = await fetch(`${API_BASE}/config/login-path`)
      const data = await res.json()
      setLoginPath(data.login_path)
    } catch (err) { console.error(err) }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`)
      const data = await res.json()
      setCategories(data)
    } catch (err) { console.error(err) }
  }

  const fetchLinks = async () => {
    let url = `${API_BASE}/links?`
    if (search) url += `q=${encodeURIComponent(search)}`
    try {
      const res = await fetch(url)
      const data = await res.json()
      setLinks(data)
    } catch (err) { console.error(err) }
  }

  const fetchMenuLinks = async () => {
    try {
      const res = await fetch(`${API_BASE}/menu-links`)
      const data = await res.json()
      if (Array.isArray(data)) {
        data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        setMenuLinks(data)
      } else {
        setMenuLinks([])
      }
    } catch (err) {
      console.error(err)
      setMenuLinks([])
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      const data = await res.json()
      if (data.token) {
        setToken(data.token)
        localStorage.setItem('token', data.token)
        setShowLogin(false)
      } else { alert('登录失败') }
    } catch (err) { alert('网络错误') }
  }

  const startScrape = async (e) => {
    e.preventDefault()
    setScraping(true)
    try {
      const res = await fetch(`${API_BASE}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: targetUrl })
      })
      const data = await res.json()

      // 智能默认值处理
      const urlObj = new URL(targetUrl.startsWith('http') ? targetUrl : 'https://' + targetUrl)
      const hostname = urlObj.hostname.replace('www.', '')
      const domainName = hostname.split('.')[0]
      const defaultTitle = domainName.charAt(0).toUpperCase() + domainName.slice(1)
      const defaultIcon = `${urlObj.origin}/favicon.ico`

      setPreviewData({
        title: data.title || defaultTitle,
        description: data.description || targetUrl,
        icon: data.icon || defaultIcon,
        url: targetUrl,
        category_id: categories[0]?.id || 1,
        tags: ''
      })
    } catch (err) { alert('爬取失败') }
    setScraping(false)
  }

  const refreshMetadata = async () => {
    if (!previewData?.url) {
      alert('无法获取网址信息')
      return
    }
    setScraping(true)
    try {
      const res = await fetch(`${API_BASE}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: previewData.url })
      })
      const data = await res.json()

      // 确保有默认值
      const urlObj = new URL(previewData.url.startsWith('http') ? previewData.url : 'https://' + previewData.url)
      const hostname = urlObj.hostname.replace('www.', '')
      const domainName = hostname.split('.')[0]
      const defaultTitle = domainName.charAt(0).toUpperCase() + domainName.slice(1)
      const defaultIcon = `${urlObj.origin}/favicon.ico`

      // 保留用户已修改的category_id和tags
      setPreviewData({
        title: data.title || defaultTitle,
        description: data.description || previewData.url,
        icon: data.icon || defaultIcon,
        url: previewData.url,
        category_id: previewData.category_id,
        tags: previewData.tags || ''
      })
      alert('已重新抓取标题、描述、图标等信息')
    } catch (err) {
      alert('更新失败: ' + err.message)
    }
    setScraping(false)
  }

  const handleSave = async () => {
    if (!previewData) {
      alert('请先抓取网址信息');
      return;
    }

    const url = isEdit ? `${API_BASE}/links/${editId}` : `${API_BASE}/links`
    const method = isEdit ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(previewData)
      })
      if (res.ok) {
        setShowModal(false)
        setPreviewData(null)
        setTargetUrl('')
        setIsEdit(false)
        setEditId(null)
        // 刷新链接列表,确保卡片更新
        await fetchLinks()
      } else {
        const error = await res.json();
        alert('保存失败: ' + (error.error || '未知错误'));
      }
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败: ' + err.message)
    }
  }

  const deleteLink = async (id, e) => {
    e.preventDefault()
    e.stopPropagation() // CRITICAL: Prevent link navigation
    if (!confirm('确定删除?')) return
    try {
      await fetch(`${API_BASE}/links/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchLinks()
    } catch (err) { console.error(err) }
  }

  const openEdit = (link, e) => {
    e.preventDefault()
    e.stopPropagation() // Prevent link navigation
    setIsEdit(true)
    setEditId(link.id)
    setPreviewData({ ...link })
    setShowModal(true)
  }

  const handleSortCategory = async (cat, direction) => {
    const level1Cats = categories.filter(c => !c.parent_id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const index = level1Cats.findIndex(c => c.id === cat.id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= level1Cats.length) return;

    // Swap items
    [level1Cats[index], level1Cats[targetIndex]] = [level1Cats[targetIndex], level1Cats[index]];

    // Reassign sort_order to all items based on new positions
    try {
      await Promise.all(
        level1Cats.map((c, idx) =>
          fetch(`${API_BASE}/categories/${c.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ...c, sort_order: idx })
          })
        )
      );
      fetchCategories();
    } catch (err) {
      console.error('排序失败:', err);
      alert('排序失败')
    }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...newCat, parent_id: newCat.parent_id ? parseInt(newCat.parent_id) : null }
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        fetchCategories()
        setShowCatAdd(false)
        setNewCat({ name: '', icon: '', parent_id: '' })
      }
    } catch (err) { alert('添加分类失败') }
  }

  const handleEditCategory = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...editingCat, parent_id: editingCat.parent_id ? parseInt(editingCat.parent_id) : null }
      const res = await fetch(`${API_BASE}/categories/${editingCat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        fetchCategories()
        setShowCatEdit(false)
      }
    } catch (err) { alert('修改分类失败') }
  }

  const deleteCategory = async (id, e) => {
    e.stopPropagation()
    if (!confirm('确定删除该分类吗？其下的链接和子分类将被彻底删除！')) return
    try {
      const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchCategories()
        fetchLinks()
        if (selectedCat === id) setSelectedCat(null)
      }
    } catch (err) { alert('删除分类失败') }
  }

  const handleClearCategoryLinks = async (catId, e) => {
    e.preventDefault()
    if (!confirm('⚠️ 危险操作：确定要清空该分类下的所有链接吗？此操作不可恢复！')) return
    try {
      const res = await fetch(`${API_BASE}/categories/${catId}/links`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        alert('链接已清空')
        fetchLinks()
      } else {
        alert('操作失败')
      }
    } catch (err) { alert('网络错误') }
  }

  const handleUpdateSettings = async (e) => {
    e.preventDefault()
    console.log('提交的数据:', settingsForm) // 调试日志
    try {
      const res = await fetch(`${API_BASE}/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsForm)
      })
      if (res.ok) {
        alert('设置已更新，请使用新凭据重新登录')
        // Reload page to clear session and update loginPath
        window.location.reload()
      } else {
        const data = await res.json()
        console.error('服务器错误:', data) // 调试日志
        alert(data.error || '更新设置失败')
      }
    } catch (err) {
      console.error('网络错误:', err) // 调试日志
      alert('网络错误，更新失败')
    }
  }

  const handleSaveMenuLink = async (e) => {
    e.preventDefault()
    const url = editMenuLink?.id ? `${API_BASE}/menu-links/${editMenuLink.id}` : `${API_BASE}/menu-links`
    const method = editMenuLink?.id ? 'PUT' : 'POST'
    const body = {
      title: menuForm.title,
      url: menuForm.url,
      icon: menuForm.icon,
      // Defaulting position to 'right' effectively for backend compat, or ignore it
      position: 'right',
      sort_order: editMenuLink?.sort_order || (menuLinks.length > 0 ? Math.max(...menuLinks.map(l => l.sort_order || 0)) + 1 : 0)
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        setShowMenuManage(false)
        fetchMenuLinks()
        setMenuForm({ title: '', url: '', icon: '' })
        setEditMenuLink(null)
      }
    } catch (err) { console.error(err) }
  }

  const handleMoveMenuLink = async (index, direction) => {
    const newLinks = [...menuLinks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newLinks.length) {
      // 1. Swap elements in the array
      const temp = newLinks[index];
      newLinks[index] = newLinks[targetIndex];
      newLinks[targetIndex] = temp;

      // 2. Re-assign sort_order based on new index to ensure uniqueness and correctness
      const updatedLinks = newLinks.map((link, idx) => ({ ...link, sort_order: idx }));

      // 3. Optimistic update
      setMenuLinks(updatedLinks);

      // 4. Persist to backend
      try {
        await Promise.all(updatedLinks.map(link =>
          fetch(`${API_BASE}/menu-links/${link.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(link)
          })
        ));
      } catch (err) {
        console.error("Order update failed", err);
        fetchMenuLinks(); // Revert on fail
      }
    }
  }

  const deleteMenuLink = async (id, e) => {
    if (!confirm('确定删除?')) return
    try {
      await fetch(`${API_BASE}/menu-links/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchMenuLinks()
    } catch (err) { console.error(err) }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE}/backup/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mynav_backup_${new Date().toISOString().split('T')[0]}.json`
      a.click()
    } catch (err) { alert('导出失败') }
  }

  const fetchSiteConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/config/site`)
      const data = await res.json()
      setSiteConfig({
        siteName: data.siteName || 'MyNav',
        siteLogo: data.siteLogo || '',
        siteDescription: data.siteDescription || '',
        pageTitle: data.pageTitle || 'MyNav',
        pageDescription: data.pageDescription || '',
        pageIcon: data.pageIcon || ''
      })
    } catch (err) {
      console.error(err)
    }
  }

  const saveSiteConfig = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE}/config/site`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          site_name: siteForm.siteName,
          site_logo: siteForm.siteLogo,
          site_description: siteForm.siteDescription,
          page_title: siteForm.pageTitle,
          page_description: siteForm.pageDescription,
          page_icon: siteForm.pageIcon
        })
      })
      if (res.ok) {
        await fetchSiteConfig()
        setShowSiteSettings(false)
        alert('网站设置已保存')
      }
    } catch (err) {
      alert('保存失败')
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result)
        const res = await fetch(`${API_BASE}/backup/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        })
        if (res.ok) {
          alert('导入成功，即将刷新页面')
          window.location.reload()
        } else {
          const err = await res.json()
          alert('导入失败: ' + err.error)
        }
      } catch (err) { alert('文件解析失败') }
    }
    reader.readAsText(file)
  }


  const [draggedLink, setDraggedLink] = useState(null)

  const handleDragStart = (link) => {
    setDraggedLink(link)
  }

  const handleDrop = async (args, targetLink) => {
    const sourceData = args.source.data
    if (!sourceData || !draggedLink) return

    const sourceLinkId = sourceData.linkId
    const targetLinkId = targetLink.id

    if (sourceLinkId === targetLinkId) {
      setDraggedLink(null)
      return
    }

    const sourceCategoryId = draggedLink.category_id
    const targetCategoryId = targetLink.category_id

    // Cross-category move
    if (sourceCategoryId !== targetCategoryId) {
      try {
        await fetch(`${API_BASE}/links/${draggedLink.id}/move`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            category_id: targetCategoryId,
            sort_order: targetLink.sort_order
          })
        })
        fetchLinks()
      } catch (err) {
        console.error('Move failed:', err)
        alert('移动失败')
      }
    } else {
      // Same category reorder
      const categoryLinks = links
        .filter(l => l.category_id === sourceCategoryId)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

      const oldIndex = categoryLinks.findIndex(l => l.id === draggedLink.id)
      const newIndex = categoryLinks.findIndex(l => l.id === targetLink.id)

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        setDraggedLink(null)
        return
      }

      const [removed] = categoryLinks.splice(oldIndex, 1)
      categoryLinks.splice(newIndex, 0, removed)

      try {
        await Promise.all(
          categoryLinks.map((link, idx) =>
            fetch(`${API_BASE}/links/${link.id}/move`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ sort_order: idx })
            })
          )
        )
        fetchLinks()
      } catch (err) {
        console.error('Reorder failed:', err)
        alert('排序失败')
      }
    }

    setDraggedLink(null)
  }

  const scrollToCategory = (catId) => {
    setSelectedCat(catId)
    const el = document.getElementById(`cat-${catId}`)
    const container = scrollRef.current
    if (el && container) {
      const elRect = el.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      // Calculate current relative position + current scroll position
      // We want el to be at top of container, plus some padding (e.g. 20px)
      const offset = elRect.top - containerRect.top
      container.scrollTo({
        top: container.scrollTop + offset - 24,
        behavior: 'smooth'
      })
    }
  }

  // Handle drag end event
  const handleDragEnd = async (event) => {
    const { active, over } = event

    if (!over || !active) return

    // Find the dragged link and target link
    const activeLink = links.find(l => l.id === active.id)
    const overLink = links.find(l => l.id === over.id)

    if (!activeLink || !overLink || activeLink.id === overLink.id) return

    // Check if moving to different category
    if (activeLink.category_id !== overLink.category_id) {
      // Cross-category move
      try {
        await fetch(`${API_BASE}/links/${activeLink.id}/move`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            category_id: overLink.category_id,
            sort_order: overLink.sort_order
          })
        })
        fetchLinks()
      } catch (err) {
        console.error('Move failed:', err)
        alert('移动失败')
      }
    } else {
      // Same category reorder
      const categoryLinks = links
        .filter(l => l.category_id === activeLink.category_id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

      const oldIndex = categoryLinks.findIndex(l => l.id === activeLink.id)
      const newIndex = categoryLinks.findIndex(l => l.id === overLink.id)

      if (oldIndex === newIndex) return

      // Reorder locally
      const [removed] = categoryLinks.splice(oldIndex, 1)
      categoryLinks.splice(newIndex, 0, removed)

      // Update sort_order for all links in this category
      try {
        await Promise.all(
          categoryLinks.map((link, idx) =>
            fetch(`${API_BASE}/links/${link.id}/move`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ sort_order: idx })
            })
          )
        )
        fetchLinks()
      } catch (err) {
        console.error('Reorder failed:', err)
        alert('排序失败')
      }
    }
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo" style={{ display: siteConfig.siteLogo ? 'flex' : 'block', alignItems: 'center', gap: '0.5rem', paddingLeft: siteConfig.siteLogo ? '0.5rem' : '0' }}>
          {siteConfig.siteLogo && <img src={siteConfig.siteLogo} alt="" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />}
          {siteConfig.siteName}
        </h2>
        {siteConfig.siteDescription && (
          <div style={{
            fontSize: '0.85rem',
            color: 'var(--text-dim)',
            marginBottom: '1rem',
            marginTop: '0',
            lineHeight: '1.4'
          }}>
            {siteConfig.siteDescription}
          </div>
        )}
        <div
          className={`nav-item ${selectedCat === null ? 'active' : ''}`}
          onClick={() => {
            setSelectedCat(null);
            scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          🌐 全部链接
        </div>
        <div className="sidebar-nav-list" style={{ flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>
          {categories.filter(c => !c.parent_id).map(cat => {
            const subCats = categories.filter(c => c.parent_id === cat.id);
            const hasSub = subCats.length > 0;
            const isExpanded = expandedCats.has(cat.id);

            return (
              <div key={cat.id}>
                <div
                  className={`nav-item ${selectedCat === cat.id ? 'active' : ''}`}
                  onClick={() => {
                    scrollToCategory(cat.id);
                    if (hasSub) toggleExpand(cat.id);
                  }}
                  style={{ position: 'relative' }}
                >
                  <span className="cat-icon">{renderIcon(cat.icon)}</span>
                  <span className="cat-name" style={{ flex: 1 }}>{cat.name}</span>
                  {hasSub && (
                    <span style={{ fontSize: '0.8rem', opacity: 0.5, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', marginRight: token ? '3rem' : '0' }}>
                      ▶
                    </span>
                  )}
                  {token && (
                    <div className="nav-admin-tools">
                      <span onClick={(e) => { e.stopPropagation(); setEditingCat(cat); setShowCatEdit(true); }}>✎</span>
                    </div>
                  )}
                </div>
                {/* Render Subcategories if expanded */}
                {isExpanded && subCats.map(sub => (
                  <div
                    key={sub.id}
                    className={`nav-item sub-item ${selectedCat === sub.id ? 'active' : ''}`}
                    style={{ paddingLeft: '2rem', fontSize: '0.9rem' }}
                    onClick={() => scrollToCategory(sub.id)}
                  >
                    <span className="cat-icon">{renderIcon(sub.icon)}</span>
                    <span className="cat-name">{sub.name}</span>
                    {token && (
                      <div className="nav-admin-tools">
                        <span onClick={(e) => { e.stopPropagation(); setEditingCat(sub); setShowCatEdit(true); }}>✎</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {token && (
          <div className="sidebar-fixed-actions">
            <div className="nav-item add-link-btn-sidebar" onClick={() => { setIsEdit(false); setPreviewData(null); setShowModal(true); }}>
              🔗 添加链接
            </div>
            <div className="nav-item add-cat-btn" onClick={() => setShowCatAdd(true)}>
              📁 添加分类
            </div>
            <div className="nav-item add-cat-btn" onClick={() => setShowCatManage(true)}>
              🗄️ 分类管理
            </div>
          </div>
        )}
        {token && (
          <div className="sidebar-footer">
            <button className="icon-btn" title="菜单管理" onClick={() => setShowMenuManage(true)}>📋</button>
            <button className="icon-btn" title="数据导入导出" onClick={() => setShowDataManage(true)}>💾</button>
            <button className="icon-btn" title="网站设置" onClick={() => { setSiteForm(siteConfig); setShowSiteSettings(true); }}>🌐</button>
            <button className="icon-btn" title="账号设置" onClick={async () => {
              setShowSettings(true)
              setSettingsForm({ username: '', password: '', oldPassword: '', login_path: '' })
            }}>⚙️</button>
            <button className="icon-btn" title="退出登录" onClick={() => { setToken(null); localStorage.removeItem('token'); }}>❌</button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        <header className="header">
          <div className="header-left">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="header-right">
            <div className="top-nav-menu">
              {menuLinks.map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="menu-item">
                  {link.icon && <span className="menu-icon">{renderIcon(link.icon)}</span>}
                  {link.title}
                </a>
              ))}
            </div>
            <div className="top-actions">
              <button className="icon-btn theme-toggle" onClick={toggleTheme}>
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
        </header>

        <main className="content-scroll" ref={scrollRef}>
          {(!search) ? (
            categories.filter(c => !c.parent_id).map(cat => {
              const subCats = categories.filter(c => c.parent_id === cat.id);

              // Check if category has any links (directly or in subcategories)
              const catLinks = links.filter(l => l.category_id === cat.id);
              const subCatsWithLinks = subCats.filter(sub =>
                links.some(l => l.category_id === sub.id)
              );

              // Hide category if it has no links and all subcategories are also empty
              if (catLinks.length === 0 && subCatsWithLinks.length === 0) {
                return null;
              }

              const renderCategorySection = (c, isSub = false) => {
                const cLinks = links.filter(l => l.category_id === c.id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

                // Hide subcategory if it has no links
                if (isSub && cLinks.length === 0) {
                  return null;
                }

                const linkCards = cLinks.map(link => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    token={token}
                    openEdit={openEdit}
                    deleteLink={deleteLink}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                  />
                ));

                return (
                  <div key={c.id} id={`cat-${c.id}`} className="category-section" style={isSub ? { paddingBottom: '0.5rem' } : {}}>
                    <h3 className="category-header" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: isSub ? '1.05rem' : '1.3rem',
                      paddingBottom: isSub ? '0.5rem' : '0',
                      borderBottom: isSub ? '1px solid var(--border)' : 'none',
                      opacity: isSub ? '0.85' : '1'
                    }}>
                      <span style={{ fontSize: isSub ? '0.95em' : '1em' }}>{renderIcon(c.icon)} {c.name}</span>
                    </h3>
                    <div className="links-grid">
                      {linkCards}
                    </div>
                  </div>
                );
              };
              return (
                <React.Fragment key={cat.id}>
                  {renderCategorySection(cat)}
                  {subCats.map(sub => renderCategorySection(sub, true))}
                </React.Fragment>
              );
            })
          ) : (
            <div className="links-grid">
              {links.map(link => (
                <LinkCard
                  key={link.id}
                  link={link}
                  token={token}
                  openEdit={openEdit}
                  deleteLink={deleteLink}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Login Modal */}
      {
        showLogin && (
          <div className="modal-overlay">
            <form className="modal" onSubmit={handleLogin}>
              <h2>管理员登录</h2>
              <div className="form-group">
                <label>用户名</label>
                <input type="text" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} autoFocus />
              </div>
              <div className="form-group">
                <label>密码</label>
                <input type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowLogin(false)}>取消</button>
                <button type="submit" className="btn btn-primary">登录</button>
              </div>
            </form>
          </div>
        )
      }

      {/* Add/Edit Link Modal */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '500px' }}>
              <h2>{isEdit ? '编辑链接' : '添加新链接'}</h2>
              {!previewData && !isEdit ? (
                <form onSubmit={startScrape}>
                  <div className="form-group">
                    <label>输入网址</label>
                    <input type="text" placeholder="github.com" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} required autoFocus />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn" onClick={() => setShowModal(false)}>取消</button>
                    <button type="submit" className="btn btn-primary" disabled={scraping}>
                      {scraping ? '爬取中...' : '预览并添加'}
                    </button>
                  </div>
                </form>
              ) : previewData && (
                <div>
                  <div className="form-group">
                    <label>标题</label>
                    <input type="text" value={previewData.title} onChange={e => setPreviewData({ ...previewData, title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>描述</label>
                    <textarea value={previewData.description || ''} onChange={e => setPreviewData({ ...previewData, description: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>图标链接</label>
                    <input type="text" value={previewData.icon || ''} onChange={e => setPreviewData({ ...previewData, icon: e.target.value })} />
                  </div>
                  {isEdit && (
                    <div className="form-group">
                      <label>网址 URL</label>
                      <input type="text" value={previewData.url || ''} onChange={e => setPreviewData({ ...previewData, url: e.target.value })} />
                    </div>
                  )}
                  <div className="form-group">
                    <label>分类</label>
                    <select
                      className="select-input"
                      value={previewData.category_id}
                      onChange={e => setPreviewData({ ...previewData, category_id: parseInt(e.target.value) })}
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="modal-actions">
                    {!isEdit && <button type="button" className="btn" onClick={() => setPreviewData(null)}>重新输入</button>}
                    <button type="button" className="btn" onClick={() => setShowModal(false)}>取消</button>
                    {isEdit && (
                      <button
                        type="button"
                        className="btn"
                        onClick={refreshMetadata}
                        disabled={scraping}
                      >
                        {scraping ? '更新中...' : '更新信息'}
                      </button>
                    )}
                    <button type="button" className="btn btn-primary" onClick={handleSave}>确认保存</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Add Category Modal */}
      {
        showCatAdd && (
          <div className="modal-overlay">
            <form className="modal" onSubmit={handleAddCategory}>
              <h2>添加分类</h2>
              <div className="form-group">
                <label>分类名称</label>
                <input type="text" placeholder="例如:工具" value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} autoFocus />
              </div>
              <div className="form-group">
                <label>图标</label>
                <input type="text" placeholder="留空则不显示图标" value={newCat.icon} onChange={e => setNewCat({ ...newCat, icon: e.target.value })} />
              </div>
              <div className="form-group">
                <label>父级分类</label>
                <select className="select-input" value={newCat.parent_id} onChange={e => setNewCat({ ...newCat, parent_id: e.target.value })}>
                  <option value="">无 (一级分类)</option>
                  {categories.filter(c => !c.parent_id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowCatAdd(false)}>取消</button>
                <button type="submit" className="btn btn-primary">确认添加</button>
              </div>
            </form>
          </div>
        )
      }
      {/* Edit Category Modal */}
      {
        showCatEdit && editingCat && (
          <div className="modal-overlay">
            <form className="modal" onSubmit={handleEditCategory}>
              <h2>编辑分类</h2>
              <div className="form-group">
                <label>分类名称</label>
                <input type="text" value={editingCat.name} onChange={e => setEditingCat({ ...editingCat, name: e.target.value })} autoFocus />
              </div>
              <div className="form-group">
                <label>图标</label>
                <input type="text" value={editingCat.icon} onChange={e => setEditingCat({ ...editingCat, icon: e.target.value })} />
              </div>
              <div className="form-group">
                <label>父级分类</label>
                <select className="select-input" value={editingCat.parent_id || ''} onChange={e => setEditingCat({ ...editingCat, parent_id: e.target.value })}>
                  <option value="">无 (一级分类)</option>
                  {categories.filter(c => !c.parent_id && c.id !== editingCat.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.5rem', display: 'block' }}>危险区域</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn" style={{ color: '#ef4444', borderColor: '#ef4444', flex: 1 }} onClick={(e) => {
                    handleClearCategoryLinks(editingCat.id, e);
                    // Not closing modal immediately to allow further actions or confirmation feedback inside handler (handler implies confirm)
                  }}>
                    🗑️ 清空所有链接
                  </button>
                  <button type="button" className="btn" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', flex: 1 }} onClick={(e) => {
                    deleteCategory(editingCat.id, e);
                    setShowCatEdit(false);
                  }}>
                    ✕ 删除此分类
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowCatEdit(false)}>取消</button>
                <button type="submit" className="btn btn-primary">确认修改</button>
              </div>
            </form>
          </div>
        )
      }

      {/* Category Manager Modal */}
      {
        showCatManage && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '600px' }}>
              <h2>分类管理</h2>
              <div className="manager-list" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {/* Render Level 1 categories */}
                {categories.filter(c => !c.parent_id).map((cat, index, arr) => {
                  const subCats = categories.filter(c => c.parent_id === cat.id);
                  return (
                    <React.Fragment key={cat.id}>
                      <div className="manager-item" style={{ display: 'flex', alignItems: 'center', padding: '0.8rem', borderBottom: '1px solid var(--border)', gap: '0.5rem' }}>
                        <span style={{ flex: 1, fontWeight: 600 }}><span dangerouslySetInnerHTML={{ __html: cat.icon }}></span> {cat.name}</span>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button className="tiny-btn" disabled={index === 0} onClick={() => handleSortCategory(cat, 'up')}>↑</button>
                          <button className="tiny-btn" disabled={index === arr.length - 1} onClick={() => handleSortCategory(cat, 'down')}>↓</button>
                          <button className="tiny-btn del" onClick={(e) => deleteCategory(cat.id, e)}>✕</button>
                        </div>
                      </div>
                      {/* Render subcategories */}
                      {subCats.map(sub => (
                        <div key={sub.id} className="manager-item" style={{ display: 'flex', alignItems: 'center', padding: '0.8rem 0.8rem 0.8rem 2.5rem', borderBottom: '1px solid var(--border)', gap: '0.5rem', background: 'var(--input-bg)' }}>
                          <span style={{ flex: 1, fontSize: '0.9rem' }}><span dangerouslySetInnerHTML={{ __html: sub.icon }}></span> {sub.name}</span>
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button className="tiny-btn del" onClick={(e) => deleteCategory(sub.id, e)}>✕</button>
                          </div>
                        </div>
                      ))}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="modal-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
                <button className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem 0.8rem' }} onClick={async () => {
                  if (confirm('清理孤儿分类？这将删除父级已不存在的分类及其链接。')) {
                    try {
                      const res = await fetch(`${API_BASE}/categories/cleanup-orphans`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      if (res.ok) {
                        const data = await res.json();
                        alert(data.message + (data.count > 0 ? ` (已清理 ${data.count} 个)` : ''));
                        fetchCategories();
                        fetchLinks();
                      } else {
                        const error = await res.json();
                        alert('清理失败: ' + (error.error || '未知错误'));
                      }
                    } catch (err) {
                      console.error('清理失败:', err);
                      alert('清理失败: ' + err.message);
                    }
                  }
                }}>🧹 清理孤儿分类</button>
                <button className="btn" onClick={() => setShowCatManage(false)}>关闭</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Data Manage Modal */}
      {
        showDataManage && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>数据导入导出</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                  <h3>导出备份</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>将全站分类和链接导出为 JSON 文件，用于备份。</p>
                  <button className="btn btn-primary" onClick={handleExport}>导出 JSON</button>
                </div>
                <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                  <h3>导入恢复</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>从 JSON 备份文件恢复数据。<span style={{ color: '#ef4444' }}>注意：重复的网址将会被合并！</span></p>
                  <input type="file" accept=".json" onChange={handleImport} style={{ fontSize: '0.8rem' }} />
                </div>
                <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                  <h3>SEO 网站地图</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>生成标准的 sitemap.xml 用于搜索引擎收录。</p>
                  <a href={`${API_BASE}/sitemap.xml`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>查看 Sitemap</a>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowDataManage(false)}>关闭</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Site Settings Modal */}
      {
        showSiteSettings && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>网站设置</h2>
              <form onSubmit={saveSiteConfig}>
                <div className="form-group">
                  <label>网站名称</label>
                  <input
                    type="text"
                    value={siteForm.siteName}
                    onChange={e => setSiteForm({ ...siteForm, siteName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>网站 Logo URL</label>
                  <input
                    type="text"
                    value={siteForm.siteLogo}
                    onChange={e => setSiteForm({ ...siteForm, siteLogo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="form-group">
                  <label>网站描述</label>
                  <textarea
                    value={siteForm.siteDescription}
                    onChange={e => setSiteForm({ ...siteForm, siteDescription: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>页面标题（浏览器标签）</label>
                  <input
                    type="text"
                    value={siteForm.pageTitle}
                    onChange={e => setSiteForm({ ...siteForm, pageTitle: e.target.value })}
                    placeholder="例如：MyNav - 我的导航站"
                  />
                </div>
                <div className="form-group">
                  <label>页面图标（Favicon）</label>
                  <input
                    type="text"
                    value={siteForm.pageIcon}
                    onChange={e => setSiteForm({ ...siteForm, pageIcon: e.target.value })}
                    placeholder="例如：https://example.com/favicon.ico"
                  />
                </div>
                <div className="form-group">
                  <label>页面描述（SEO）</label>
                  <textarea
                    value={siteForm.pageDescription}
                    onChange={e => setSiteForm({ ...siteForm, pageDescription: e.target.value })}
                    placeholder="显示在搜索引擎结果中的描述"
                    rows={3}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn" onClick={() => setShowSiteSettings(false)}>取消</button>
                  <button type="submit" className="btn btn-primary">保存</button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Admin Settings Modal */}
      {
        showSettings && (
          <div className="modal-overlay">
            <form className="modal" onSubmit={handleUpdateSettings}>
              <h2>管理员设置</h2>
              <div className="form-group">
                <label>当前密码</label>
                <input type="password" placeholder="请输入当前密码以验证身份" value={settingsForm.oldPassword} onChange={e => setSettingsForm({ ...settingsForm, oldPassword: e.target.value })} required autoFocus autocomplete="off" />
              </div>
              <div className="form-group">
                <label>新用户名</label>
                <input type="text" placeholder="留空则保持不变" value={settingsForm.username} onChange={e => setSettingsForm({ ...settingsForm, username: e.target.value })} autocomplete="off" />
              </div>
              <div className="form-group">
                <label>新密码</label>
                <input type="password" placeholder="留空则保持不变" value={settingsForm.password} onChange={e => setSettingsForm({ ...settingsForm, password: e.target.value })} autocomplete="new-password" />
              </div>
              <div className="form-group">
                <label>登录入口地址 (目前: #{loginPath || 'loading...'})</label>
                <input type="text" placeholder="例如: mysecret (无需前缀#)" value={settingsForm.login_path} onChange={e => setSettingsForm({ ...settingsForm, login_path: e.target.value })} autocomplete="off" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowSettings(false)}>取消</button>
                <button type="submit" className="btn btn-primary">确认保存</button>
              </div>
            </form>
          </div>
        )
      }

      {/* Menu Manage Modal */}
      {
        showMenuManage && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '600px' }}>
              <h2>顶部菜单管理</h2>
              <div className="menu-list-edit" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                {menuLinks.map((link, index) => (
                  <div key={link.id} className="menu-item-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '20px', textAlign: 'center' }}>{renderIcon(link.icon)}</span>
                      <span style={{ flex: 1 }}>{link.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button className="tiny-btn" disabled={index === 0} onClick={() => handleMoveMenuLink(index, 'up')}>↑</button>
                      <button className="tiny-btn" disabled={index === menuLinks.length - 1} onClick={() => handleMoveMenuLink(index, 'down')}>↓</button>
                      <button className="tiny-btn" onClick={() => { setEditMenuLink(link); setMenuForm(link); }}>编辑</button>
                      <button className="tiny-btn del" onClick={(e) => deleteMenuLink(link.id, e)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSaveMenuLink} style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: '0.5rem' }}>
                <h3>{editMenuLink ? '编辑链接' : '新增链接'}</h3>
                <div className="form-group-row" style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>标题</label>
                    <input type="text" value={menuForm.title} onChange={e => setMenuForm({ ...menuForm, title: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>网址</label>
                    <input type="text" value={menuForm.url} onChange={e => setMenuForm({ ...menuForm, url: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>图标</label>
                  <input type="text" value={menuForm.icon} onChange={e => setMenuForm({ ...menuForm, icon: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary">{editMenuLink ? '更新' : '添加'}</button>
                  {editMenuLink && <button type="button" className="btn" onClick={() => { setEditMenuLink(null); setMenuForm({ title: '', url: '', icon: '' }); }}>取消编辑</button>}
                </div>
              </form>

              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowMenuManage(false)}>关闭</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Data Manage Modal */}
      {
        showDataManage && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>数据导入导出</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                  <h3>导出备份</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>将全站分类和链接导出为 JSON 文件，用于备份。</p>
                  <button className="btn btn-primary" onClick={handleExport}>导出 JSON</button>
                </div>
                <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                  <h3>导入恢复</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>从 JSON 备份文件恢复数据。<span style={{ color: '#ef4444' }}>注意：重复的网址将会被合并！</span></p>
                  <input type="file" accept=".json" onChange={handleImport} style={{ fontSize: '0.8rem' }} />
                </div>
                <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                  <h3>SEO 网站地图</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>生成标准的 sitemap.xml 用于搜索引擎收录。</p>
                  <a href={`${API_BASE}/sitemap.xml`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>查看/下载 Sitemap</a>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowDataManage(false)}>关闭</button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}


// 辅助函数: 根据字符串生成渐变色
function generateGradient(str) {
  // 简单哈希函数
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  // 生成两个颜色
  const hue1 = Math.abs(hash % 360)
  const hue2 = (hue1 + 60) % 360

  return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 50%))`
}

// 辅助函数: 从URL提取首字母
function getInitialFromUrl(url) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : 'http://' + url)
    const hostname = urlObj.hostname.replace('www.', '')
    const name = hostname.split('.')[0]
    return name.charAt(0).toUpperCase()
  } catch {
    return '🔗'
  }
}

function LinkCard({ link, token, openEdit, deleteLink, onDragStart, onDrop }) {
  const cardRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [imgError, setImgError] = useState(false)

  // 当图标链接变化时,重置错误状态
  useEffect(() => {
    setImgError(false)
  }, [link.icon])

  useEffect(() => {
    const el = cardRef.current
    if (!el || !token) return

    return combine(
      draggable({
        element: el,
        getInitialData: () => ({ linkId: link.id, categoryId: link.category_id }),
        onDragStart: () => {
          setIsDragging(true)
          if (onDragStart) onDragStart(link)
        },
        onDrop: () => setIsDragging(false)
      }),
      dropTargetForElements({
        element: el,
        getData: () => ({ linkId: link.id, categoryId: link.category_id }),
        onDragEnter: () => setIsDragOver(true),
        onDragLeave: () => setIsDragOver(false),
        onDrop: (args) => {
          setIsDragOver(false)
          if (onDrop) onDrop(args, link)
        }
      })
    )
  }, [link, token, onDragStart, onDrop])

  return (
    <a
      ref={cardRef}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`link-card${isDragging ? ' is-dragging' : ''}${isDragOver ? ' drag-over' : ''}`}
      draggable={token}
      title={link.description}
      onClick={(e) => {
        if (isDragging) e.preventDefault()
      }}
    >
      {imgError || !link.icon ? (
        <div
          className="card-icon"
          style={{
            background: generateGradient(link.url || link.title),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}
        >
          {getInitialFromUrl(link.url)}
        </div>
      ) : (
        <img
          src={link.icon}
          className="card-icon"
          onError={() => setImgError(true)}
        />
      )}
      <div className="card-info">
        <div className="card-title">{link.title}</div>
        <div className="card-desc">{link.description}</div>
      </div>
      {token && (
        <div className="card-admin-actions">
          <button className="tiny-btn" onClick={(e) => openEdit(link, e)}>✎</button>
          <button className="tiny-btn del" onClick={(e) => deleteLink(link.id, e)}>✕</button>
        </div>
      )}
    </a>
  )
}

export default App
