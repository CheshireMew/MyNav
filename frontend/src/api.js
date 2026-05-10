const API_BASE = '/api'

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    if (response.status === 401 && options.token) {
      window.dispatchEvent(new CustomEvent('mynav:unauthorized'))
    }
    throw new Error(payload?.error || payload || 'Request failed')
  }

  return payload
}

export const api = {
  login: (body) => request('/login', { method: 'POST', body }),
  getLoginPath: () => request('/config/login-path'),
  getSiteConfig: () => request('/config/site'),
  updateSiteConfig: (token, body) => request('/config/site', { method: 'PUT', token, body }),
  listCategories: () => request('/categories'),
  createCategory: (token, body) => request('/categories', { method: 'POST', token, body }),
  updateCategory: (token, id, body) => request(`/categories/${id}`, { method: 'PUT', token, body }),
  deleteCategory: (token, id) => request(`/categories/${id}`, { method: 'DELETE', token }),
  clearCategoryLinks: (token, id) => request(`/categories/${id}/links`, { method: 'DELETE', token }),
  reorderCategory: (token, id, direction) => request(`/categories/${id}/reorder`, { method: 'POST', token, body: { direction } }),
  listLinks: (search = '') => request(`/links${search ? `?q=${encodeURIComponent(search)}` : ''}`),
  createLink: (token, body) => request('/links', { method: 'POST', token, body }),
  updateLink: (token, id, body) => request(`/links/${id}`, { method: 'PUT', token, body }),
  deleteLink: (token, id) => request(`/links/${id}`, { method: 'DELETE', token }),
  moveLink: (token, id, body) => request(`/links/${id}/move`, { method: 'PATCH', token, body }),
  scrape: (token, url) => request('/scrape', { method: 'POST', token, body: { url } }),
  listMenuLinks: () => request('/menu-links'),
  createMenuLink: (token, body) => request('/menu-links', { method: 'POST', token, body }),
  updateMenuLink: (token, id, body) => request(`/menu-links/${id}`, { method: 'PUT', token, body }),
  deleteMenuLink: (token, id) => request(`/menu-links/${id}`, { method: 'DELETE', token }),
  reorderMenuLink: (token, id, direction) => request(`/menu-links/${id}/reorder`, { method: 'POST', token, body: { direction } }),
  exportData: (token) => request('/backup/export', { token }),
  importData: (token, body) => request('/backup/import', { method: 'POST', token, body }),
  updateUser: (token, body) => request('/user', { method: 'PUT', token, body })
}

export { API_BASE }
