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
    // 这里后续会连接到数据库
    // 暂时使用默认设置
    console.log('加载系统设置')
  }

  // 更新设置
  const updateSettings = async (newSettings) => {
    Object.assign(settings, newSettings)
    // 这里后续会保存到数据库
    console.log('更新设置:', newSettings)
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