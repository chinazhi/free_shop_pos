<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <div class="sidebar">
      <div class="logo">
        <h2>便利店POS</h2>
      </div>
      <el-menu
        :default-active="$route.path"
        class="sidebar-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item
          v-for="route in menuRoutes"
          :key="route.path"
          :index="route.path"
        >
          <el-icon><component :is="route.meta.icon" /></el-icon>
          <span>{{ route.meta.title }}</span>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部栏 -->
      <div class="header">
        <div class="header-left">
          <h3>{{ currentPageTitle }}</h3>
        </div>
        <div class="header-right">
          <el-space>
            <el-text class="user-info">
              收银员：{{ appStore.currentUser?.name || '未登录' }}
            </el-text>
            <el-text class="time-info">
              {{ currentTime }}
            </el-text>
            <el-button
              type="primary"
              size="small"
              @click="showAbout = true"
            >
              关于
            </el-button>
          </el-space>
        </div>
      </div>

      <!-- 页面内容 -->
      <div class="content">
        <router-view />
      </div>
    </div>

    <!-- 关于对话框 -->
    <el-dialog
      v-model="showAbout"
      title="关于系统"
      width="400px"
      center
    >
      <div class="about-content">
        <h3>便利店收银系统</h3>
        <p>版本：v1.0.0</p>
        <p>基于 Electron + Vue.js 开发</p>
        <p>适用于小型便利店日常收银管理</p>
        <br>
        <p><strong>主要功能：</strong></p>
        <ul>
          <li>商品销售收银</li>
          <li>商品库存管理</li>
          <li>会员积分管理</li>
          <li>销售报表统计</li>
          <li>系统参数设置</li>
        </ul>
      </div>
      <template #footer>
        <el-button @click="showAbout = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useProductsStore } from '../stores/products'

const route = useRoute()
const appStore = useAppStore()
const productsStore = useProductsStore()

const showAbout = ref(false)
const currentTime = ref('')
let timeInterval = null

// 菜单路由
const menuRoutes = [
  {
    path: '/pos',
    meta: { title: '收银台', icon: 'ShoppingCart' }
  },
  {
    path: '/products',
    meta: { title: '商品管理', icon: 'Box' }
  },
  {
    path: '/inventory',
    meta: { title: '库存管理', icon: 'Goods' }
  },
  {
    path: '/members',
    meta: { title: '会员管理', icon: 'User' }
  },
  {
    path: '/sales',
    meta: { title: '销售记录', icon: 'Document' }
  },
  {
    path: '/reports',
    meta: { title: '报表统计', icon: 'DataAnalysis' }
  },
  {
    path: '/settings',
    meta: { title: '系统设置', icon: 'Setting' }
  }
]

// 当前页面标题
const currentPageTitle = computed(() => {
  const currentRoute = menuRoutes.find(r => r.path === route.path)
  return currentRoute?.meta.title || '便利店收银系统'
})

// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(async () => {
  try {
    appStore.loading = true // 可选：全局 loading 状态
    await productsStore.loadProducts()
    await productsStore.loadCategories()
  } catch (error) {
    console.error('初始化商品/分类失败:', error)
    // 可用 ElMessage 或全局提示
    ElMessage.error('初始化数据失败，请重试')
  } finally {
    appStore.loading = false // 可选
  }
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
}

.sidebar {
  width: 200px;
  background-color: #304156;
  color: white;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #434a50;
}

.logo h2 {
  margin: 0;
  font-size: 18px;
  color: #409eff;
}

.sidebar-menu {
  flex: 1;
  border: none;
}

.sidebar-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}

.header-left h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info,
.time-info {
  font-size: 14px;
  color: #666;
}

.content {
  flex: 1;
  overflow-y: auto;
  background-color: #f5f5f5;
}

.about-content {
  text-align: center;
}

.about-content h3 {
  color: #409eff;
  margin-bottom: 20px;
}

.about-content ul {
  text-align: left;
  padding-left: 20px;
}

.about-content li {
  margin-bottom: 5px;
}
</style>