import { useState } from 'react'
import { api } from '../api'

const emptyMenuForm = { title: '', url: '', icon: { type: 'none', value: '' } }

export function useMenuActions({ token, refreshMenuLinks }) {
  const [menuForm, setMenuForm] = useState(emptyMenuForm)
  const [editingMenuLink, setEditingMenuLink] = useState(null)

  const saveMenuLink = async (event) => {
    event.preventDefault()
    try {
      if (editingMenuLink) await api.updateMenuLink(token, editingMenuLink.id, menuForm)
      else await api.createMenuLink(token, menuForm)
      cancelEditMenuLink()
      await refreshMenuLinks()
    } catch (error) {
      alert(`保存失败: ${error.message}`)
    }
  }

  const deleteMenuLink = async (id) => {
    if (!confirm('确定删除?')) return
    await api.deleteMenuLink(token, id)
    await refreshMenuLinks()
  }

  const reorderMenuLink = async (id, direction) => {
    await api.reorderMenuLink(token, id, direction)
    await refreshMenuLinks()
  }

  const editMenuLink = (link) => {
    setEditingMenuLink(link)
    setMenuForm({ title: link.title, url: link.url, icon: link.icon })
  }

  const cancelEditMenuLink = () => {
    setEditingMenuLink(null)
    setMenuForm(emptyMenuForm)
  }

  return {
    menuForm,
    setMenuForm,
    isEditingMenuLink: Boolean(editingMenuLink),
    saveMenuLink,
    deleteMenuLink,
    reorderMenuLink,
    editMenuLink,
    cancelEditMenuLink
  }
}
