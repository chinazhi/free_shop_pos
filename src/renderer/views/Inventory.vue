<template>
  <div class="inventory-page">
    <div class="page-header">
      <h2>库存管理</h2>
      <p>管理商品库存，查看库存变动记录</p>
    </div>

    <!-- 库存统计 -->
    <div class="stats-grid">
      <div class="stats-card">
        <div class="stats-icon" style="background: #409eff">
          <el-icon><Box /></el-icon>
        </div>
        <div class="stats-content">
          <h3>{{ totalStock }}</h3>
          <p>总库存量</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon" style="background: #e6a23c">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stats-content">
          <h3>{{ lowStockCount }}</h3>
          <p>库存不足</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon" style="background: #f56c6c">
          <el-icon><Close /></el-icon>
        </div>
        <div class="stats-content">
          <h3>{{ outOfStockCount }}</h3>
          <p>缺货商品</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon" style="background: #67c23a">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stats-content">
          <h3>¥{{ totalValue.toFixed(2) }}</h3>
          <p>库存总价值</p>
        </div>
      </div>
    </div>

    <!-- 库存预警 -->
    <div class="card" v-if="lowStockProducts.length > 0">
      <div class="card-header">
        <span class="card-title">库存预警</span>
        <el-tag type="warning">{{ lowStockProducts.length }}件商品库存不足</el-tag>
      </div>
      <el-table :data="lowStockProducts" stripe>
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="stock" label="当前库存" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="warning" size="small">{{ row.stock }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="min_stock" label="最低库存" width="100" align="center" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="quickRestock(row)">
              快速补货
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 库存变动记录 -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">库存变动记录</span>
        <div class="header-actions">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
          />
          <el-select v-model="typeFilter" placeholder="变动类型" size="small" style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="入库" value="in" />
            <el-option label="出库" value="out" />
            <el-option label="调整" value="adjust" />
          </el-select>
        </div>
      </div>
      
      <el-table :data="paginatedLogs" stripe v-loading="logsLoading">
        <el-table-column prop="product_name" label="商品名称" />
        <el-table-column prop="type" label="变动类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getLogTagType(row.type)"
              size="small"
            >
              {{ getLogTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="变动数量" width="100" align="center">
          <template #default="{ row }">
            <span :class="getQuantityClass(row.type)">
              {{ row.type === 'out' ? '-' : '+' }}{{ row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="before_stock" label="变动前" width="100" align="center" />
        <el-table-column prop="after_stock" label="变动后" width="100" align="center" />
        <el-table-column prop="reason" label="变动原因" />
        <el-table-column prop="operator" label="操作员" width="100" />
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="totalFilteredLogs"
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </div>

    <!-- 快速补货对话框 -->
    <el-dialog
      v-model="showRestockDialog"
      title="快速补货"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="商品名称">
          <el-text>{{ restockProduct?.name }}</el-text>
        </el-form-item>
        <el-form-item label="当前库存">
          <el-text type="warning">{{ restockProduct?.stock }}</el-text>
        </el-form-item>
        <el-form-item label="最低库存">
          <el-text>{{ restockProduct?.min_stock }}</el-text>
        </el-form-item>
        <el-form-item label="补货数量">
          <el-input-number
            v-model="restockQuantity"
            :min="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="补货原因">
          <el-input
            v-model="restockReason"
            placeholder="补货原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetRestockDialog" :disabled="loading">取消</el-button>
        <el-button type="primary" @click="confirmRestock" :loading="loading">确定补货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Box, Warning, Close, TrendCharts } from '@element-plus/icons-vue'
import { useProductsStore } from '../stores/products'

const productsStore = useProductsStore()

// 响应式数据
const loading = ref(false)
const dateRange = ref([])
const typeFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const showRestockDialog = ref(false)
const restockProduct = ref(null)
const restockQuantity = ref(0)
const restockReason = ref('')

// 库存变动记录数据
const inventoryLogs = ref([])
const logsLoading = ref(false)



// 计算属性
const totalStock = computed(() => {
  return productsStore.products.reduce((sum, product) => sum + product.stock, 0)
})

const lowStockCount = computed(() => {
  return productsStore.lowStockProducts.length
})

const outOfStockCount = computed(() => {
  return productsStore.products.filter(p => p.stock === 0).length
})

const totalValue = computed(() => {
  return productsStore.products.reduce((sum, product) => {
    return sum + (product.stock * product.cost)
  }, 0)
})

const lowStockProducts = computed(() => {
  return productsStore.lowStockProducts
})

// 筛选后的库存变动记录
const filteredLogs = computed(() => {
  let filtered = inventoryLogs.value
  
  // 类型筛选
  if (typeFilter.value) {
    filtered = filtered.filter(log => log.type === typeFilter.value)
  }
  
  // 日期范围筛选
  if (dateRange.value && dateRange.value.length === 2) {
    const [startDate, endDate] = dateRange.value
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    
    filtered = filtered.filter(log => {
      const logDate = new Date(log.created_at)
      return logDate >= start && logDate <= end
    })
  }
  
  return filtered
})

// 分页后的数据
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredLogs.value.slice(start, end)
})

// 更新总记录数
const totalFilteredLogs = computed(() => {
  return filteredLogs.value.length
})

// 方法
const getLogTagType = (type) => {
  switch (type) {
    case 'in': return 'success'
    case 'out': return 'danger'
    case 'adjust': return 'warning'
    default: return 'info'
  }
}

const getLogTypeText = (type) => {
  switch (type) {
    case 'in': return '入库'
    case 'out': return '出库'
    case 'adjust': return '调整'
    default: return '未知'
  }
}

const getQuantityClass = (type) => {
  return type === 'out' ? 'text-red' : 'text-green'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const quickRestock = (product) => {
  restockProduct.value = product
  restockQuantity.value = Math.max(product.min_stock - product.stock, 1)
  restockReason.value = '库存不足补货'
  showRestockDialog.value = true
}

const confirmRestock = async () => {
  try {
    if (!restockQuantity.value || restockQuantity.value <= 0) {
      ElMessage.warning('请输入有效的补货数量')
      return
    }
    
    if (!restockReason.value.trim()) {
      ElMessage.warning('请输入补货原因')
      return
    }
    
    loading.value = true
    
    await productsStore.updateStock(
      restockProduct.value.id,
      restockQuantity.value,
      'in',
      restockReason.value,
      '管理员'
    )
    
    ElMessage.success('补货成功')
    resetRestockDialog()
    
    // 重新加载库存记录
    await loadInventoryLogs()
  } catch (error) {
    ElMessage.error(error.message || '补货失败')
  } finally {
    loading.value = false
  }
}

const resetRestockDialog = () => {
  showRestockDialog.value = false
  restockProduct.value = null
  restockQuantity.value = 0
  restockReason.value = ''
}

// 加载库存变动记录
const loadInventoryLogs = async () => {
  try {
    logsLoading.value = true
    const filters = {}
    
    // 添加日期筛选
    if (dateRange.value && dateRange.value.length === 2) {
      filters.start_date = dateRange.value[0]
      filters.end_date = dateRange.value[1]
    }
    
    // 添加类型筛选
    if (typeFilter.value) {
      filters.type = typeFilter.value
    }
    
    const logs = await productsStore.getInventoryLogs(filters)
    inventoryLogs.value = logs
  } catch (error) {
    console.error('加载库存记录失败:', error)
    ElMessage.error('加载库存记录失败')
  } finally {
    logsLoading.value = false
  }
}

// 监听筛选条件变化，重置分页并重新加载数据
watch([dateRange, typeFilter], () => {
  currentPage.value = 1
  loadInventoryLogs()
})

onMounted(() => {
  if (productsStore.products.length === 0) {
    productsStore.loadProducts()
  }
  loadInventoryLogs()
})
</script>

<style scoped>
.inventory-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stats-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stats-content h3 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
}

.stats-content p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.text-red {
  color: #f56c6c;
}

.text-green {
  color: #67c23a;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>