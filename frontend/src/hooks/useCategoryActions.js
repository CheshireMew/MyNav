import { useState } from 'react'
import { api } from '../api'

const emptyCategoryForm = { name: '', icon: { type: 'none', value: '' }, parent_id: null }

export function useCategoryActions({ token, refreshCategories, refreshLinks, refreshPublicData, openModal, closeModal }) {
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm)
  const [editingCategory, setEditingCategory] = useState(null)

  const saveCategory = async (event) => {
    event.preventDefault()
    try {
      if (editingCategory) await api.updateCategory(token, editingCategory.id, categoryForm)
      else await api.createCategory(token, categoryForm)
      setEditingCategory(null)
      closeModal()
      await refreshCategories()
    } catch (error) {
      alert(`保存失败: ${error.message}`)
    }
  }

  const deleteCategory = async (id) => {
    if (!confirm('确定删除该分类及其所有子分类和链接吗？')) return
    try {
      await api.deleteCategory(token, id)
      await refreshPublicData()
    } catch (error) {
      alert(`删除失败: ${error.message}`)
    }
  }

  const clearCategoryLinks = async () => {
    if (!editingCategory || !confirm('确定清空该分类下的链接吗？')) return
    await api.clearCategoryLinks(token, editingCategory.id)
    await refreshLinks()
  }

  const reorderCategory = async (id, direction) => {
    await api.reorderCategory(token, id, direction)
    await refreshCategories()
  }

  const openAddCategory = () => {
    setEditingCategory(null)
    setCategoryForm(emptyCategoryForm)
    openModal('category')
  }

  const openEditCategory = (category) => {
    setEditingCategory(category)
    setCategoryForm({ name: category.name, icon: category.icon, parent_id: category.parent_id || null })
    openModal('category')
  }

  return {
    categoryForm,
    setCategoryForm,
    editingCategory,
    saveCategory,
    deleteCategory,
    clearCategoryLinks,
    reorderCategory,
    openAddCategory,
    openEditCategory
  }
}
