import { defineStore } from 'pinia'
import { ref } from 'vue'
import dbManager from '../utils/indexedDB.js'

export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const settings = ref({})
  const loading = ref(false)

  // 方法
  const loadSettings = async () => {
    try {
      loading.value = true
      const dbSettings = await dbManager.getAll('settings')
      // 转换为键值对对象
      const settingsObj = {}
      dbSettings.forEach(setting => {
        settingsObj[setting.key] = setting.value
      })
      settings.value = settingsObj
    } catch (error) {
      console.error('加载设置失败:', error)
      // 使用默认设置
      settings.value = {
        shop_name: '便利店',
        shop_address: '地址',
        shop_phone: '电话',
        tax_rate: '0'
      }
    } finally {
      loading.value = false
    }
  }

  const updateSetting = async (key, value) => {
    try {
      await dbManager.update('settings', { key, value })
      settings.value[key] = value
    } catch (error) {
      console.error('更新设置失败:', error)
      throw error
    }
  }

  const updateSettings = async (newSettings) => {
    try {
      for (const [key, value] of Object.entries(newSettings)) {
        await dbManager.update('settings', { key, value })
        settings.value[key] = value
      }
    } catch (error) {
      console.error('批量更新设置失败:', error)
      throw error
    }
  }

  const getSetting = (key, defaultValue = '') => {
    return settings.value[key] || defaultValue
  }

  return {
    settings,
    loading,
    loadSettings,
    updateSetting,
    updateSettings,
    getSetting
  }
})