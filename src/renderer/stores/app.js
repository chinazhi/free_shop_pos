import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 应用状态
  const isLoading = ref(false)
  const currentUser = ref(null)
  const settings = reactive({
    shopName: '便利店',
    taxRate: 0,
    currency: 'CNY',
    receiptFooter: '谢谢惠顾，欢迎再次光临！',
    autoPrint: false
  })

  // 初始化应用
  const initApp = async () => {
    try {
      isLoading.value = true
      // 加载系统设置
      await loadSettings()
      // 设置默认收银员
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

  // 加载系统设置
  const loadSettings = async () => {
    try {
      const settingsArr = await window.ipcRenderer.invoke('get-settings')
      if (Array.isArray(settingsArr)) {
        for (const s of settingsArr) {
          if (settings.hasOwnProperty(s.key)) {
            // 尝试自动类型转换
            let val = s.value
            if (typeof settings[s.key] === 'boolean') {
              val = s.value === 'true' || s.value === true
            } else if (typeof settings[s.key] === 'number') {
              val = Number(s.value)
            }
            settings[s.key] = val
          }
        }
      }
    } catch (e) {
      console.error('加载系统设置失败:', e)
    }
  }

  // 更新设置
  const updateSettings = async (newSettings) => {
    try {
      Object.assign(settings, newSettings)
      // 组装要保存的设置数组
      const settingsArr = Object.keys(settings).map(key => ({ key, value: settings[key] }))
      await window.ipcRenderer.invoke('update-settings', settingsArr)
    } catch (e) {
      console.error('保存系统设置失败:', e)
    }
  }

  // 设置当前用户
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