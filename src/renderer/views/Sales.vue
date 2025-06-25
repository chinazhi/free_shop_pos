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
    <div class="search-bar">
      <el-row :gutter="20" align="middle">
        <el-col :span="5">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索订单号或收银员"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="statusFilter" placeholder="订单状态" clearable>
            <el-option label="全部状态" value="" />
            <el-option label="已完成" value="completed" />
            <el-option label="已退款" value="refunded" />
            <el-option label="部分退款" value="partial_refund" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="paymentFilter" placeholder="支付方式" clearable>
            <el-option label="全部方式" value="" />
            <el-option label="现金" value="cash" />
            <el-option label="微信" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="银行卡" value="card" />
          </el-select>
        </el-col>
        <el-col :span="7">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            size="default"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-col>
        <el-col :span="4">
          <div class="button-group">
            <el-button @click="handleExport">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 销售记录表格 -->
    <div class="table-container">
      <el-table
        :data="paginatedSales"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
        v-loading="loading"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="order_no" label="订单号" width="150" />
        <el-table-column prop="cashier" label="收银员" width="100" />
        <el-table-column prop="member_name" label="会员" width="120">
          <template #default="{ row }">
            <span v-if="row.member_name">{{ row.member_name }}</span>
            <el-text v-else type="info">散客</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="items_count" label="商品数" width="80" align="center" />
        <el-table-column prop="subtotal" label="小计" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.subtotal.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="discount_amount" label="折扣" width="100" align="right">
          <template #default="{ row }">
            <span v-if="row.discount_amount > 0" class="discount-amount">
              -¥{{ row.discount_amount.toFixed(2) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="tax_amount" label="税费" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.tax_amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="总计" width="120" align="right">
          <template #default="{ row }">
            <el-text type="primary" size="large" tag="b">
              ¥{{ row.total_amount.toFixed(2) }}
            </el-text>
          </template>
        </el-table-column>
        <el-table-column prop="payment_method" label="支付方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getPaymentTagType(row.payment_method)" size="small">
              {{ getPaymentText(row.payment_method) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="交易时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewOrder(row)">
              详情
            </el-button>
            <el-button type="info" size="small" @click="printReceipt(row)">
              打印
            </el-button>
            <el-button 
              v-if="row.status === 'completed'"
              type="warning" 
              size="small" 
              @click="handleRefundOrder(row)"
            >
              退款
            </el-button>
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
          <el-form-item label="退款类型">
            <el-radio-group v-model="refundType">
              <el-radio label="full">全额退款</el-radio>
              <el-radio label="partial">部分退款</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="refundType === 'partial'" label="退款金额">
            <el-input-number
              v-model="refundAmount"
              :min="0.01"
              :max="refundOrder.total_amount"
              :precision="2"
              style="width: 100%"
            />
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
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
const ipcRenderer = window.ipcRenderer

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

// 销售数据
const sales = ref([])
const orderItems = ref([])

async function loadSales() {
  loading.value = true
  let sql = `SELECT s.id, s.order_no, s.cashier, m.name as member_name, s.total_amount, s.discount_amount, s.tax_amount, s.final_amount, s.payment_method, s.payment_status as status, s.created_at,
    (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as items_count,
    s.final_amount as subtotal, 0 as received_amount, 0 as change_amount
    FROM sales s LEFT JOIN members m ON s.member_id = m.id ORDER BY s.created_at DESC`;
  try {
    const result = await ipcRenderer.invoke('db-query', sql)
    sales.value = result
  } catch (e) {
    ElMessage.error('加载销售数据失败')
  } finally {
    loading.value = false
  }
}

async function loadOrderItems(orderId) {
  let sql = `SELECT p.name as product_name, si.unit_price as price, si.quantity, si.discount as discount_amount, si.total_price as subtotal
    FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?`;
  try {
    orderItems.value = await ipcRenderer.invoke('db-query', sql, [orderId])
  } catch (e) {
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
    .reduce((sum, s) => sum + s.total_amount, 0)
})

const averageOrderValue = computed(() => {
  const completedSales = sales.value.filter(s => s.status === 'completed')
  if (completedSales.length === 0) return 0
  const total = completedSales.reduce((sum, s) => sum + s.total_amount, 0)
  return total / completedSales.length
})

const totalItems = computed(() => {
  const today = new Date().toDateString()
  return sales.value
    .filter(s => 
      new Date(s.created_at).toDateString() === today &&
      s.status !== 'refunded'
    )
    .reduce((sum, s) => sum + s.items_count, 0)
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
  refundType.value = 'full'
  refundAmount.value = order.total_amount
  refundReason.value = ''
  showRefundDialog.value = true
}

const confirmRefund = async () => {
  if (!refundReason.value.trim()) {
    ElMessage.warning('请输入退款原因')
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
    
    // 更新订单状态
    const index = sales.value.findIndex(s => s.id === refundOrder.value.id)
    if (index !== -1) {
      sales.value[index].status = refundType.value === 'full' ? 'refunded' : 'partial_refund'
      if (refundType.value === 'partial') {
        sales.value[index].refund_amount = refundAmount.value
      }
    }
    
    ElMessage.success('退款处理成功')
    showRefundDialog.value = false
  } catch {
    // 用户取消
  }
}

const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

const refreshData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('数据刷新成功')
  }, 1000)
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

.search-bar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.table-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .search-bar .el-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .button-group {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>

// 保证组件能被动态导入
export default {}