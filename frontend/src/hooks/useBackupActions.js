import { api } from '../api'

export function useBackupActions({ token, refreshPublicData }) {
  const exportData = async () => {
    const data = await api.exportData(token)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `mynav_backup_${new Date().toISOString().split('T')[0]}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importData = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      await api.importData(token, data)
      await refreshPublicData()
      alert('导入成功')
    } catch (error) {
      alert(`导入失败: ${error.message}`)
    }
  }

  return {
    exportData,
    importData
  }
}
