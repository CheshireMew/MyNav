import { useState } from 'react'
import { api } from '../api'

export function useAdminSettings({ token, refreshPublicData, logout, closeModal }) {
  const [settingsForm, setSettingsForm] = useState({ username: '', password: '', oldPassword: '', login_path: '' })

  const openAdminSettings = (openModal) => {
    setSettingsForm({ username: '', password: '', oldPassword: '', login_path: '' })
    openModal('admin')
  }

  const saveAdminSettings = async (event) => {
    event.preventDefault()
    try {
      await api.updateUser(token, settingsForm)
      logout()
      closeModal()
      alert('设置已更新，请重新登录')
      await refreshPublicData()
    } catch (error) {
      alert(error.message)
    }
  }

  return {
    settingsForm,
    setSettingsForm,
    openAdminSettings,
    saveAdminSettings
  }
}
