<template>
  <div class="sales-page">
    <div class="page-header">
      <h2>销售记录</h2>
      <p>查看和管理销售订单记录</p>
    </div>

    <!-- 销售统计 -->
    <div class="stats-grid">
      <div class="stats-card">
        <div class="stats-icon" style="background: #409eff">
          <el-icon><ShoppingBag /></el-icon>
        </div>
        <div class="stats-content">
          <h3>{{ todayOrders }}</h3>
          <p>今日订单</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon" style="background: #67c23a">
          <el-icon><Money /></el-icon>
        </div>
        <div class="stats-content">
          <h3>¥{{ todayRevenue.toFixed(2) }}</h3>
          <p>今日营业额</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon" style="background: #e6a23c">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stats-content">
          <h3>¥{{ averageOrderValue.toFixed(2) }}</h3>
          <p>平均客单价</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon" style="background: #f56c6c">
          <el-icon><Goods /></el-icon>
        </div>
        <div class="stats-content">
          <h3>{{ totalItems }}</h3>
          <p>商品销量</p>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="search-filter-container">
      <!-- 筛选条件区域 -->
      <div class="filter-section">
        <div class="filter-item">
          <label class="filter-label">时间范围：</label>
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            size="default"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="date-range-picker"
          />
        </div>
        <div class="filter-item">
          <label class="filter-label">订单状态：</label>
          <el-select 
            v-model="statusFilter" 
            placeholder="请选择状态" 
            clearable
            class="status-select"
          >
            <el-option label="全部状态" value="" />
            <el-option label="已完成" value="completed" />
            <el-option label="已退款" value="refunded" />
            <el-option label="部分退款" value="partial_refund" />
          </el-select>
        </div>
        <div class="filter-item refresh-item">
          <el-button type="primary" @click="refreshData" class="refresh-button">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
        <div class="filter-item column-settings-item">
          <el-button type="default" @click="showColumnSettings = true" class="column-settings-button" :icon="Setting">
          </el-button>
        </div>
      </div>
    </div>

    <!-- 销售记录表格 -->
    <div class="table-container">
      <el-table
        :data="paginatedSales"
        stripe
        border
        @selection-change="handleSelectionChange"
        v-loading="loading"
        class="sales-table"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column v-if="columnVisibility.order_no" prop="order_no" label="订单号" width="180" align="center" />
        <el-table-column v-if="columnVisibility.cashier" prop="cashier" label="收银员" width="80" align="center" />
        <el-table-column v-if="columnVisibility.member_name" prop="member_name" label="会员" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.member_name">{{ row.member_name }}</span>
            <el-text v-else type="info">散客</el-text>
          </template>
        </el-table-column>
        <el-table-column v-if="columnVisibility.items_count" prop="items_count" label="商品数" width="80" align="center" />
        <el-table-column v-if="columnVisibility.subtotal" prop="subtotal" label="小计" width="100" align="center">
          <template #default="{ row }">
            ¥{{ row.subtotal.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column v-if="columnVisibility.discount_amount" prop="discount_amount" label="折扣" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.discount_amount > 0" class="discount-amount">
              -¥{{ row.discount_amount.toFixed(2) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columnVisibility.tax_amount" prop="tax_amount" label="税费" width="100" align="center">
          <template #default="{ row }">
            ¥{{ row.tax_amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column v-if="columnVisibility.total_amount" prop="total_amount" label="总计" width="120" align="center">
          <template #default="{ row }">
            <el-text type="primary" size="large" tag="b">
              ¥{{ row.total_amount.toFixed(2) }}
            </el-text>
          </template>
        </el-table-column>
        <el-table-column v-if="columnVisibility.payment_method" prop="payment_method" label="支付方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getPaymentTagType(row.payment_method)" size="small">
              {{ getPaymentText(row.payment_method) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="columnVisibility.status" prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="columnVisibility.created_at" prop="created_at" label="交易时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="viewOrder(row)">
                详情
              </el-button>
              <el-button type="info" size="small" @click="printReceipt(row)">
                打印
              </el-button>
              <el-button 
                v-if="row.status === 'completed' && (!row.refund_amount || row.refund_amount === 0)"
                type="warning" 
                size="small" 
                @click="handleRefundOrder(row)"
              >
                退款
              </el-button>
              <el-button 
                v-if="row.status === 'partial_refund'"
                type="warning" 
                size="small" 
                @click="handleRefundOrder(row)"
              >
                继续退款
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredSales.length"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </div>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="订单详情"
      width="800px"
    >
      <div v-if="selectedOrder" class="order-detail">
        <!-- 订单基本信息 -->
        <div class="detail-section">
          <h4>订单信息</h4>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>订单号：</label>
                <span>{{ selectedOrder.order_no }}</span>
              </div>
              <div class="detail-item">
                <label>收银员：</label>
                <span>{{ selectedOrder.cashier }}</span>
              </div>
              <div class="detail-item">
                <label>会员：</label>
                <span>{{ selectedOrder.member_name || '散客' }}</span>
              </div>
              <div class="detail-item">
                <label>交易时间：</label>
                <span>{{ formatDateTime(selectedOrder.created_at) }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>支付方式：</label>
                <el-tag :type="getPaymentTagType(selectedOrder.payment_method)">
                  {{ getPaymentText(selectedOrder.payment_method) }}
                </el-tag>
              </div>
              <div class="detail-item">
                <label>订单状态：</label>
                <el-tag :type="getStatusTagType(selectedOrder.status)">
                  {{ getStatusText(selectedOrder.status) }}
                </el-tag>
              </div>
              <div class="detail-item">
                <label>收款金额：</label>
                <span>¥{{ selectedOrder.received_amount?.toFixed(2) || '0.00' }}</span>
              </div>
              <div class="detail-item">
                <label>找零金额：</label>
                <span>¥{{ selectedOrder.change_amount?.toFixed(2) || '0.00' }}</span>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 商品明细 -->
        <div class="detail-section">
          <h4>商品明细</h4>
          <el-table :data="orderItems" size="small">
            <el-table-column prop="product_name" label="商品名称" />
            <el-table-column prop="price" label="单价" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.price.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" align="center" />
            <el-table-column prop="discount_amount" label="折扣" width="100" align="right">
              <template #default="{ row }">
                <span v-if="row.discount_amount > 0" class="discount-amount">
                  -¥{{ row.discount_amount.toFixed(2) }}
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="subtotal" label="小计" width="120" align="right">
              <template #default="{ row }">
                ¥{{ row.subtotal.toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 金额汇总 -->
        <div class="detail-section">
          <h4>金额汇总</h4>
          <div class="amount-summary">
            <div class="summary-item">
              <label>商品小计：</label>
              <span>¥{{ selectedOrder.subtotal.toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <label>折扣金额：</label>
              <span class="discount-amount">-¥{{ selectedOrder.discount_amount.toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <label>税费：</label>
              <span>¥{{ selectedOrder.tax_amount.toFixed(2) }}</span>
            </div>
            <div class="summary-item total">
              <label>订单总计：</label>
              <span>¥{{ selectedOrder.total_amount.toFixed(2) }}</span>
            </div>
            <div v-if="selectedOrder.refund_amount && selectedOrder.refund_amount > 0" class="summary-item">
              <label>退款金额：</label>
              <span class="discount-amount">-¥{{ selectedOrder.refund_amount.toFixed(2) }}</span>
            </div>
            <div v-if="selectedOrder.refund_reason" class="summary-item">
              <label>退款原因：</label>
              <span>{{ selectedOrder.refund_reason }}</span>
            </div>
            <div v-if="selectedOrder.refund_time" class="summary-item">
              <label>退款时间：</label>
              <span>{{ formatDateTime(selectedOrder.refund_time) }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="printReceipt(selectedOrder)">
          打印小票
        </el-button>
      </template>
    </el-dialog>

    <!-- 退款对话框 -->
    <el-dialog
      v-model="showRefundDialog"
      title="订单退款"
      width="500px"
    >
      <div v-if="refundOrder">
        <el-alert
          title="退款提醒"
          type="warning"
          description="退款操作不可撤销，请确认退款信息无误后再提交。"
          :closable="false"
          style="margin-bottom: 20px"
        />
        
        <el-form label-width="100px">
          <el-form-item label="订单号">
            <el-text>{{ refundOrder.order_no }}</el-text>
          </el-form-item>
          <el-form-item label="订单金额">
            <el-text type="primary">¥{{ refundOrder.total_amount.toFixed(2) }}</el-text>
          </el-form-item>
          <el-form-item v-if="refundOrder.refund_amount && refundOrder.refund_amount > 0" label="已退款金额">
            <el-text type="warning">¥{{ refundOrder.refund_amount.toFixed(2) }}</el-text>
          </el-form-item>
          <el-form-item v-if="refundOrder.refund_amount && refundOrder.refund_amount > 0" label="剩余金额">
            <el-text type="info">¥{{ (refundOrder.total_amount - refundOrder.refund_amount).toFixed(2) }}</el-text>
          </el-form-item>
          <el-form-item label="退款类型">
            <el-radio-group v-model="refundType">
              <el-radio label="full" :disabled="refundOrder.status === 'partial_refund'">全额退款</el-radio>
              <el-radio label="partial">部分退款</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="refundType === 'partial'" label="退款金额">
            <el-input-number
              v-model="refundAmount"
              :min="0.01"
              :max="refundOrder.total_amount - (refundOrder.refund_amount || 0)"
              :precision="2"
              style="width: 100%"
            />
            <div style="font-size: 12px; color: #999; margin-top: 4px;">
              最大可退款：¥{{ (refundOrder.total_amount - (refundOrder.refund_amount || 0)).toFixed(2) }}
            </div>
          </el-form-item>
          <el-form-item label="退款原因">
            <el-input
              v-model="refundReason"
              type="textarea"
              :rows="3"
              placeholder="请输入退款原因"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showRefundDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmRefund">确认退款</el-button>
      </template>
    </el-dialog>

    <!-- 列设置对话框 -->
    <el-dialog
      v-model="showColumnSettings"
      title="列显示设置"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="column-settings">
        <div class="column-item" v-for="(label, key) in columnLabels" :key="key">
          <el-checkbox v-model="columnVisibility[key]">
            {{ label }}
          </el-checkbox>
        </div>
      </div>
      <template #footer>
        <el-button @click="resetColumns">重置</el-button>
        <el-button type="primary" @click="showColumnSettings = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('')
const paymentFilter = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const selectedSales = ref([])
const showDetailDialog = ref(false)
const showRefundDialog = ref(false)
const selectedOrder = ref(null)
const refundOrder = ref(null)
const refundType = ref('full')
const refundAmount = ref(0)
const refundReason = ref('')
const showColumnSettings = ref(false)

// 列显示控制
const columnVisibility = ref({
  order_no: true,
  cashier: true,
  member_name: false,
  items_count: true,
  subtotal: true,
  discount_amount: false,
  tax_amount: false,
  total_amount: true,
  payment_method: true,
  status: true,
  created_at: true
})

// 列标签映射
const columnLabels = {
  order_no: '订单号',
  cashier: '收银员',
  member_name: '会员',
  items_count: '商品数',
  subtotal: '小计',
  discount_amount: '折扣',
  tax_amount: '税费',
  total_amount: '总计',
  payment_method: '支付方式',
  status: '状态',
  created_at: '交易时间'
}

// 重置列显示
const resetColumns = () => {
  Object.keys(columnVisibility.value).forEach(key => {
    columnVisibility.value[key] = true
  })
}

// 销售数据
const sales = ref([])
const orderItems = ref([])

// 在 script setup 部分，添加导入
import dbManager from '../utils/indexedDB.js'

// 修改 loadSales 函数
async function loadSales() {
  loading.value = true
  try {
    // 确保数据库已初始化
    if (!dbManager.db) {
      await dbManager.init()
    }
    
    // 获取销售记录
    const salesData = await dbManager.getAll('sales')
    
    // 为每条记录添加商品数量统计
    for (const sale of salesData) {
      const items = await dbManager.getAllByIndex('sale_items', 'sale_id', sale.id)
      sale.items_count = items.length
      sale.subtotal = sale.final_amount || sale.total_amount || 0
      sale.total_amount = sale.final_amount || sale.total_amount || 0
      sale.member_name = null // 暂时设为null，因为已移除会员功能
      sale.received_amount = sale.received_amount || 0
      sale.change_amount = sale.change_amount || 0
      sale.status = sale.payment_status || 'completed'
      sale.created_at = sale.sale_date || sale.created_at || new Date().toISOString()
      sale.order_no = sale.order_no || `ORDER-${sale.id}`
      sale.cashier = sale.cashier || '收银员'
      sale.discount_amount = sale.discount_amount || 0
      sale.tax_amount = sale.tax_amount || 0
    }
    
    sales.value = salesData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (e) {
    console.error('加载销售数据失败:', e)
    ElMessage.error('加载销售数据失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

// 修改 loadOrderItems 函数
async function loadOrderItems(orderId) {
  try {
    if (!dbManager.db) {
      await dbManager.init()
    }
    
    const items = await dbManager.getAllByIndex('sale_items', 'sale_id', orderId)
    
    // 获取商品详细信息
    for (const item of items) {
      const product = await dbManager.getById('products', item.product_id)
      if (product) {
        item.product_name = product.name
        item.price = item.unit_price || product.price
        item.discount_amount = item.discount || 0
        item.subtotal = item.total_price || (item.quantity * item.price)
      }
    }
    
    orderItems.value = items
  } catch (e) {
    console.error('加载订单明细失败:', e)
    orderItems.value = []
  }
}

const viewOrder = (order) => {
  selectedOrder.value = order
  loadOrderItems(order.id)
  showDetailDialog.value = true
}

onMounted(() => {
  loadSales()
})
// 计算属性
const filteredSales = computed(() => {
  let filtered = sales.value
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(s => 
      s.order_no.toLowerCase().includes(keyword) ||
      s.cashier.toLowerCase().includes(keyword) ||
      (s.member_name && s.member_name.toLowerCase().includes(keyword))
    )
  }
  
  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(s => s.status === statusFilter.value)
  }
  
  // 支付方式过滤
  if (paymentFilter.value) {
    filtered = filtered.filter(s => s.payment_method === paymentFilter.value)
  }
  
  // 日期范围过滤
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    filtered = filtered.filter(s => {
      const saleDate = new Date(s.created_at)
      return saleDate >= new Date(start) && saleDate <= new Date(end)
    })
  }
  
  return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

const paginatedSales = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredSales.value.slice(start, end)
})

const todayOrders = computed(() => {
  const today = new Date().toDateString()
  return sales.value.filter(s => 
    new Date(s.created_at).toDateString() === today &&
    s.status !== 'refunded'
  ).length
})

const todayRevenue = computed(() => {
  const today = new Date().toDateString()
  return sales.value
    .filter(s => 
      new Date(s.created_at).toDateString() === today &&
      s.status !== 'refunded'
    )
    .reduce((sum, s) => sum + (s.total_amount || 0), 0)
})

const averageOrderValue = computed(() => {
  const completedSales = sales.value.filter(s => s.status === 'completed')
  if (completedSales.length === 0) return 0
  const total = completedSales.reduce((sum, s) => sum + (s.total_amount || 0), 0)
  return total / completedSales.length
})

const totalItems = computed(() => {
  const today = new Date().toDateString()
  return sales.value
    .filter(s => 
      new Date(s.created_at).toDateString() === today &&
      s.status !== 'refunded'
    )
    .reduce((sum, s) => sum + (s.items_count || 0), 0)
})

// 方法
const handleSelectionChange = (selection) => {
  selectedSales.value = selection
}

const getPaymentTagType = (method) => {
  switch (method) {
    case 'cash': return 'success'
    case 'wechat': return 'success'
    case 'alipay': return 'warning'
    case 'card': return 'info'
    default: return 'info'
  }
}

const getPaymentText = (method) => {
  switch (method) {
    case 'cash': return '现金'
    case 'wechat': return '微信'
    case 'alipay': return '支付宝'
    case 'card': return '银行卡'
    default: return '未知'
  }
}

const getStatusTagType = (status) => {
  switch (status) {
    case 'completed': return 'success'
    case 'refunded': return 'danger'
    case 'partial_refund': return 'warning'
    default: return 'info'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'completed': return '已完成'
    case 'refunded': return '已退款'
    case 'partial_refund': return '部分退款'
    default: return '未知'
  }
}

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const printReceipt = (order) => {
  ElMessage.info('打印功能开发中...')
}

const handleRefundOrder = (order) => {
  refundOrder.value = order
  const currentRefundAmount = order.refund_amount || 0
  const remainingAmount = order.total_amount - currentRefundAmount
  
  // 如果是部分退款状态，默认选择部分退款
  if (order.status === 'partial_refund') {
    refundType.value = 'partial'
    refundAmount.value = remainingAmount
  } else {
    refundType.value = 'full'
    refundAmount.value = order.total_amount
  }
  
  refundReason.value = ''
  showRefundDialog.value = true
}

const confirmRefund = async () => {
  if (!refundReason.value.trim()) {
    ElMessage.warning('请输入退款原因')
    return
  }
  
  // 验证退款金额
  const currentRefundAmount = refundOrder.value.refund_amount || 0
  const remainingAmount = refundOrder.value.total_amount - currentRefundAmount
  
  if (refundType.value === 'partial' && refundAmount.value > remainingAmount) {
    ElMessage.warning(`退款金额不能超过剩余金额 ¥${remainingAmount.toFixed(2)}`)
    return
  }
  
  if (refundType.value === 'partial' && refundAmount.value <= 0) {
    ElMessage.warning('退款金额必须大于0')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确认${refundType.value === 'full' ? '全额' : '部分'}退款 ¥${refundType.value === 'full' ? refundOrder.value.total_amount.toFixed(2) : refundAmount.value.toFixed(2)} 吗？`,
      '确认退款',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 计算新的退款金额（累加之前的退款金额）
    const currentRefundAmount = refundOrder.value.refund_amount || 0
    const newRefundAmount = refundType.value === 'full' ? refundOrder.value.total_amount : currentRefundAmount + refundAmount.value
    
    // 确定新状态
    const newStatus = newRefundAmount >= refundOrder.value.total_amount ? 'refunded' : 'partial_refund'
    
    // 更新数据库中的订单状态
    if (!dbManager.db) {
      await dbManager.init()
    }
    
    const sale = await dbManager.getById('sales', refundOrder.value.id)
    if (sale) {
      sale.payment_status = newStatus
      sale.refund_amount = newRefundAmount
      sale.refund_reason = refundReason.value
      sale.refund_time = new Date().toISOString()
      await dbManager.update('sales', sale)
    }
    
    // 更新前端显示的订单状态
    const index = sales.value.findIndex(s => s.id === refundOrder.value.id)
    if (index !== -1) {
      sales.value[index].status = newStatus
      sales.value[index].refund_amount = newRefundAmount
      sales.value[index].refund_reason = refundReason.value
      sales.value[index].refund_time = new Date().toISOString().replace('T', ' ').substring(0, 19)
    }
    
    ElMessage.success('退款处理成功')
    showRefundDialog.value = false
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退款处理失败:', error)
      ElMessage.error('退款处理失败，请重试')
    }
  }
}

const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

const refreshData = async () => {
  try {
    await loadSales()
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('数据刷新失败，请重试')
  }
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.sales-page {
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

.search-filter-container {
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e8e8e8;
}

.filter-section {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 32px;
  justify-content: space-between;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-item {
  margin-left: auto;
}

.filter-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
  min-width: 70px;
}

.date-range-picker {
  width: 320px;
}

.status-select {
  width: 160px;
}

.refresh-button {
  min-width: 100px;
}

.table-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.sales-table {
  width: 100%;
}

.el-table {
  border-radius: 8px;
  overflow: hidden;
}

.action-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.discount-amount {
  color: #f56c6c;
}

.order-detail {
  padding: 0 20px;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.detail-item label {
  width: 100px;
  color: #666;
  font-size: 14px;
}

.detail-item span {
  color: #333;
  font-size: 14px;
}

.amount-summary {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}

.summary-item.total {
  border-top: 1px solid #e0e0e0;
  padding-top: 12px;
  margin-top: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.summary-item label {
  color: #666;
}

.summary-item span {
  color: #333;
  font-weight: 500;
}

/* 电脑端专用样式，无需响应式 */

.column-settings-item {
  margin-left: 4px;
}

.column-settings-button {
  background: #f5f7fa;
  border-color: #dcdfe6;
  color: #606266;
}

.column-settings {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 8px 0;
}

.column-item {
  display: flex;
  align-items: center;
}
</style>