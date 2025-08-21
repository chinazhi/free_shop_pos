import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { useSettingsStore } from './settings.js'

export const useAppStore = defineStore('app', () => {
  const isLoading = ref(false)
  const currentUser = ref(null)
  const settings = reactive({})

  const initApp = async () => {
    try {
      isLoading.value = true
      await loadSettings()
      currentUser.value = {
        id: 1,
        name: '收银员',
        role: 'cashier'
      }
    } catch (error) {
      console.error('应用初始化失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  const loadSettings = async () => {
    try {
      const settingsStore = useSettingsStore()
      await settingsStore.loadSettings()
      // 将设置复制到本地reactive对象
      Object.assign(settings, settingsStore.settings)
    } catch (e) {
      console.error('加载系统设置失败:', e)
    }
  }

  const updateSettings = async (newSettings) => {
    try {
      const settingsStore = useSettingsStore()
      await settingsStore.updateSettings(newSettings)
      Object.assign(settings, newSettings)
    } catch (e) {
      console.error('保存系统设置失败:', e)
      throw e
    }
  }

  /**
   * 设置当前用户信息
   * @param {Object} user - 用户对象，包含用户ID、名称、角色等信息
   */
  const setCurrentUser = (user) => {
    currentUser.value = user
  }

  return {
    isLoading,
    currentUser,
    settings,
    initApp,
    loadSettings,
    updateSettings,
    setCurrentUser
  }
})

/**
 * 解析设置值
 * @param {string} val - 需要解析的设置值
 * @returns {boolean|object|string} - 解析后的值
 * - 如果是 'true' 或 'false' 字符串，返回对应的布尔值
 * - 如果是合法的 JSON 字符串，返回解析后的对象
 * - 其他情况返回原始字符串
 */
function parseSettingValue(val) {
  if (val === 'true') return true
  if (val === 'false') return false
  try {
    return JSON.parse(val)
  } catch {
    return val
  }
}
