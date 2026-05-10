import { useState } from 'react'
import { api } from '../api'
import { defaultCategoryId } from '@mynav/shared/category'
import { fallbackIconForUrl } from '@mynav/shared/icon'
import { titleFromUrl } from '@mynav/shared/urlMetadata'

export function useLinkActions({ token, categories, refreshLinks, openModal, closeModal }) {
  const [editingLinkId, setEditingLinkId] = useState(null)
  const [targetUrl, setTargetUrl] = useState('')
  const [previewData, setPreviewData] = useState(null)
  const [scraping, setScraping] = useState(false)
  const [draggedLink, setDraggedLink] = useState(null)

  const loadMetadata = async (url) => {
    setScraping(true)
    try {
      const data = await api.scrape(token, url)
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
      const title = data.title || titleFromUrl(normalizedUrl)
      setPreviewData({
        url: normalizedUrl,
        title,
        description: data.description || normalizedUrl,
        icon: data.icon?.type === 'none' ? fallbackIconForUrl(normalizedUrl) : data.icon,
        category_id: defaultCategoryId(categories),
        tags: ''
      })
    } catch (error) {
      alert(`爬取失败: ${error.message}`)
    } finally {
      setScraping(false)
    }
  }

  const scrape = async (event) => {
    event.preventDefault()
    await loadMetadata(targetUrl)
  }

  const refreshMetadata = async () => {
    if (!previewData?.url) return
    const previous = previewData
    await loadMetadata(previewData.url)
    setPreviewData(current => current ? { ...current, category_id: previous.category_id, tags: previous.tags } : current)
  }

  const saveLink = async () => {
    try {
      if (editingLinkId) await api.updateLink(token, editingLinkId, previewData)
      else await api.createLink(token, previewData)
      closeLinkModal()
      await refreshLinks()
    } catch (error) {
      alert(`保存失败: ${error.message}`)
    }
  }

  const deleteLink = async (id, event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!confirm('确定删除?')) return
    await api.deleteLink(token, id)
    await refreshLinks()
  }

  const moveLink = async (targetLink) => {
    if (!draggedLink || draggedLink.id === targetLink.id) {
      setDraggedLink(null)
      return
    }
    try {
      await api.moveLink(token, draggedLink.id, {
        target_link_id: targetLink.id,
        target_category_id: targetLink.category_id
      })
      await refreshLinks()
    } catch (error) {
      alert(`排序失败: ${error.message}`)
    } finally {
      setDraggedLink(null)
    }
  }

  const openAddLink = () => {
    setEditingLinkId(null)
    setPreviewData(null)
    setTargetUrl('')
    openModal('link')
  }

  const openEditLink = (link, event) => {
    event.preventDefault()
    event.stopPropagation()
    setEditingLinkId(link.id)
    setPreviewData({ ...link })
    openModal('link')
  }

  const closeLinkModal = () => {
    setEditingLinkId(null)
    setPreviewData(null)
    setTargetUrl('')
    closeModal()
  }

  return {
    isEditingLink: Boolean(editingLinkId),
    targetUrl,
    setTargetUrl,
    previewData,
    setPreviewData,
    scraping,
    setDraggedLink,
    scrape,
    refreshMetadata,
    saveLink,
    deleteLink,
    moveLink,
    openAddLink,
    openEditLink,
    closeLinkModal
  }
}
