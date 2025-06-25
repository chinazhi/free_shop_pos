<template>
  <div class="reports-page">
    <div class="page-header">
      <h2>报表统计</h2>
      <p>查看销售数据分析和统计报表</p>
    </div>

    <!-- 时间范围选择 -->
    <div class="time-selector">
      <el-card>
        <el-row :gutter="20" align="middle">
          <el-col :span="6">
            <el-radio-group v-model="timeRange" @change="handleTimeRangeChange">
              <el-radio-button label="today">今日</el-radio-button>
              <el-radio-button label="week">本周</el-radio-button>
              <el-radio-button label="month">本月</el-radio-button>
              <el-radio-button label="custom">自定义</el-radio-button>
            </el-radio-group>
          </el-col>
          <el-col :span="8">
            <el-date-picker
              v-if="timeRange === 'custom'"
              v-model="customDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="loadReportData"
            />
          </el-col>
          <el-col :span="6">
            <div class="button-group">
              <el-button type="primary" @click="loadReportData">
                <el-icon><Refresh /></el-icon>
                刷新数据
              </el-button>
              <el-button @click="exportReport">
                <el-icon><Download /></el-icon>
                导出报表
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 核心指标 -->
    <div class="metrics-grid">
      <div class="metric-card revenue">
        <div class="metric-icon">
          <el-icon><Money /></el-icon>
        </div>
        <div class="metric-content">
          <h3>¥{{ totalRevenue.toFixed(2) }}</h3>
          <p>总营业额</p>
          <div class="metric-trend" :class="revenueTrend.type">
            <el-icon v-if="revenueTrend.type === 'up'"><TrendCharts /></el-icon>
            <el-icon v-else><Bottom /></el-icon>
            <span>{{ revenueTrend.value }}%</span>
          </div>
        </div>
      </div>
      
      <div class="metric-card orders">
        <div class="metric-icon">
          <el-icon><ShoppingBag /></el-icon>
        </div>
        <div class="metric-content">
          <h3>{{ totalOrders }}</h3>
          <p>订单数量</p>
          <div class="metric-trend" :class="ordersTrend.type">
            <el-icon v-if="ordersTrend.type === 'up'"><TrendCharts /></el-icon>
            <el-icon v-else><Bottom /></el-icon>
            <span>{{ ordersTrend.value }}%</span>
          </div>
        </div>
      </div>
      
      <div class="metric-card customers">
        <div class="metric-icon">
          <el-icon><User /></el-icon>
        </div>
        <div class="metric-content">
          <h3>{{ totalCustomers }}</h3>
          <p>客户数量</p>
          <div class="metric-trend" :class="customersTrend.type">
            <el-icon v-if="customersTrend.type === 'up'"><TrendCharts /></el-icon>
            <el-icon v-else><Bottom /></el-icon>
            <span>{{ customersTrend.value }}%</span>
          </div>
        </div>
      </div>
      
      <div class="metric-card avg-order">
        <div class="metric-icon">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="metric-content">
          <h3>¥{{ averageOrderValue.toFixed(2) }}</h3>
          <p>平均客单价</p>
          <div class="metric-trend" :class="avgOrderTrend.type">
            <el-icon v-if="avgOrderTrend.type === 'up'"><TrendCharts /></el-icon>
            <el-icon v-else><Bottom /></el-icon>
            <span>{{ avgOrderTrend.value }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <!-- 销售趋势图 -->
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>销售趋势</span>
            <el-radio-group v-model="salesChartType" size="small">
              <el-radio-button label="revenue">营业额</el-radio-button>
              <el-radio-button label="orders">订单量</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div class="chart-container" ref="salesChartRef"></div>
      </el-card>

      <!-- 商品销售排行 -->
      <el-card class="chart-card">
        <template #header>
          <span>商品销售排行</span>
        </template>
        <div class="chart-container" ref="productChartRef"></div>
      </el-card>

      <!-- 支付方式分布 -->
      <el-card class="chart-card">
        <template #header>
          <span>支付方式分布</span>
        </template>
        <div class="chart-container" ref="paymentChartRef"></div>
      </el-card>

      <!-- 时段销售分析 -->
      <el-card class="chart-card">
        <template #header>
          <span>时段销售分析</span>
        </template>
        <div class="chart-container" ref="hourlyChartRef"></div>
      </el-card>
    </div>

    <!-- 详细报表 -->
    <div class="detailed-reports">
      <el-tabs v-model="activeTab">
        <!-- 销售明细 -->
        <el-tab-pane label="销售明细" name="sales">
          <div class="table-container">
            <el-table :data="salesDetails" stripe border>
              <el-table-column prop="date" label="日期" width="120" />
              <el-table-column prop="orders" label="订单数" width="100" align="center" />
              <el-table-column prop="revenue" label="营业额" width="120" align="right">
                <template #default="{ row }">
                  ¥{{ row.revenue.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="avg_order" label="平均客单价" width="120" align="right">
                <template #default="{ row }">
                  ¥{{ row.avg_order.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="customers" label="客户数" width="100" align="center" />
              <el-table-column prop="items_sold" label="商品销量" width="100" align="center" />
              <el-table-column prop="refunds" label="退款金额" width="120" align="right">
                <template #default="{ row }">
                  ¥{{ row.refunds.toFixed(2) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 商品分析 -->
        <el-tab-pane label="商品分析" name="products">
          <div class="table-container">
            <el-table :data="productAnalysis" stripe border>
              <el-table-column prop="name" label="商品名称" min-width="200" />
              <el-table-column prop="category" label="分类" width="120" />
              <el-table-column prop="sold_quantity" label="销售数量" width="100" align="center" />
              <el-table-column prop="revenue" label="销售额" width="120" align="right">
                <template #default="{ row }">
                  ¥{{ row.revenue.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="profit" label="利润" width="120" align="right">
                <template #default="{ row }">
                  ¥{{ row.profit.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="profit_margin" label="利润率" width="100" align="center">
                <template #default="{ row }">
                  {{ (row.profit_margin * 100).toFixed(1) }}%
                </template>
              </el-table-column>
              <el-table-column prop="stock" label="库存" width="100" align="center" />
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 会员分析 -->
        <el-tab-pane label="会员分析" name="members">
          <div class="member-stats">
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="stat-item">
                  <h4>会员消费占比</h4>
                  <div class="big-number">{{ memberConsumptionRate }}%</div>
                  <p>会员消费金额占总消费的比例</p>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-item">
                  <h4>新增会员</h4>
                  <div class="big-number">{{ newMembers }}</div>
                  <p>本期新增会员数量</p>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-item">
                  <h4>活跃会员</h4>
                  <div class="big-number">{{ activeMembers }}</div>
                  <p>本期有消费的会员数量</p>
                </div>
              </el-col>
            </el-row>
            
            <div class="table-container" style="margin-top: 30px;">
              <h4>会员消费排行</h4>
              <el-table :data="memberRanking" stripe border>
                <el-table-column type="index" label="排名" width="80" align="center" />
                <el-table-column prop="name" label="会员姓名" width="120" />
                <el-table-column prop="level" label="等级" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag :type="getLevelTagType(row.level)" size="small">
                      {{ getLevelText(row.level) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="orders" label="订单数" width="100" align="center" />
                <el-table-column prop="total_spent" label="消费金额" width="120" align="right">
                  <template #default="{ row }">
                    ¥{{ row.total_spent.toFixed(2) }}
                  </template>
                </el-table-column>
                <el-table-column prop="avg_order" label="平均客单价" width="120" align="right">
                  <template #default="{ row }">
                    ¥{{ row.avg_order.toFixed(2) }}
                  </template>
                </el-table-column>
                <el-table-column prop="last_visit" label="最后消费" width="150">
                  <template #default="{ row }">
                    {{ formatDate(row.last_visit) }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const timeRange = ref('today')
const customDateRange = ref([])
const salesChartType = ref('revenue')
const activeTab = ref('sales')

// 图表引用
const salesChartRef = ref()
const productChartRef = ref()
const paymentChartRef = ref()
const hourlyChartRef = ref()

// 模拟数据
const ipcRenderer = window.ipcRenderer
const reportData = ref({
  totalRevenue: 0,
  totalOrders: 0,
  totalCustomers: 0,
  averageOrderValue: 0,
  trends: {
    revenue: { type: 'up', value: 0 },
    orders: { type: 'up', value: 0 },
    customers: { type: 'up', value: 0 },
    avgOrder: { type: 'up', value: 0 }
  }
})
const salesDetails = ref([])
const productAnalysis = ref([])
const memberRanking = ref([])

// 计算属性
const totalRevenue = computed(() => reportData.value.totalRevenue)
const totalOrders = computed(() => reportData.value.totalOrders)
const totalCustomers = computed(() => reportData.value.totalCustomers)
const averageOrderValue = computed(() => reportData.value.averageOrderValue)

const revenueTrend = computed(() => reportData.value.trends.revenue)
const ordersTrend = computed(() => reportData.value.trends.orders)
const customersTrend = computed(() => reportData.value.trends.customers)
const avgOrderTrend = computed(() => reportData.value.trends.avgOrder)

const memberConsumptionRate = computed(() => {
  return reportData.value.memberConsumptionRate || 0
})
const newMembers = computed(() => {
  return reportData.value.newMembers || 0
})
const activeMembers = computed(() => {
  return reportData.value.activeMembers || 0
})

// 方法
const handleTimeRangeChange = () => {
  if (timeRange.value !== 'custom') {
    customDateRange.value = []
  }
  loadReportData()
}

const loadReportData = async () => {
  // 时间范围处理
  let startDate, endDate
  const today = new Date()
  if (timeRange.value === 'today') {
    startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  } else if (timeRange.value === 'week') {
    const day = today.getDay() || 7
    startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - day + 1)
    endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  } else if (timeRange.value === 'month') {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  } else if (timeRange.value === 'custom' && customDateRange.value.length === 2) {
    startDate = new Date(customDateRange.value[0])
    endDate = new Date(customDateRange.value[1])
    endDate.setDate(endDate.getDate() + 1)
  } else {
    startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  }
  const start = startDate.toISOString().slice(0, 10)
  const end = endDate.toISOString().slice(0, 10)
  // 1. 核心指标
  const coreSql = `SELECT COUNT(*) as totalOrders, IFNULL(SUM(final_amount),0) as totalRevenue, COUNT(DISTINCT member_id) as totalCustomers, IFNULL(AVG(final_amount),0) as averageOrderValue FROM sales WHERE created_at >= ? AND created_at < ? AND payment_status != 'refunded'`
  const core = await ipcRenderer.invoke('db-get', coreSql, [start, end])
  reportData.value.totalRevenue = core.totalRevenue
  reportData.value.totalOrders = core.totalOrders
  reportData.value.totalCustomers = core.totalCustomers
  reportData.value.averageOrderValue = core.averageOrderValue
  // 2. 销售明细（日维度）
  const detailSql = `SELECT substr(created_at,1,10) as date, COUNT(*) as orders, IFNULL(SUM(final_amount),0) as revenue, IFNULL(AVG(final_amount),0) as avg_order, COUNT(DISTINCT member_id) as customers, (SELECT IFNULL(SUM(quantity),0) FROM sale_items si WHERE si.sale_id = s.id) as items_sold, IFNULL(SUM(CASE WHEN payment_status='refunded' THEN final_amount ELSE 0 END),0) as refunds FROM sales s WHERE created_at >= ? AND created_at < ? GROUP BY date ORDER BY date DESC`
  salesDetails.value = await ipcRenderer.invoke('db-query', detailSql, [start, end])
  // 3. 商品分析
  const productSql = `SELECT p.name, p.category, IFNULL(SUM(si.quantity),0) as sold_quantity, IFNULL(SUM(si.total_price),0) as revenue, IFNULL(SUM((si.unit_price-p.cost)*si.quantity),0) as profit, CASE WHEN SUM(si.total_price)>0 THEN SUM((si.unit_price-p.cost)*si.quantity)/SUM(si.total_price) ELSE 0 END as profit_margin, p.stock FROM sale_items si JOIN products p ON si.product_id=p.id JOIN sales s ON si.sale_id=s.id WHERE s.created_at >= ? AND s.created_at < ? GROUP BY si.product_id ORDER BY sold_quantity DESC`
  productAnalysis.value = await ipcRenderer.invoke('db-query', productSql, [start, end])
  // 4. 会员分析
  const memberSql = `SELECT m.name, m.level, COUNT(s.id) as orders, IFNULL(SUM(s.final_amount),0) as total_spent, IFNULL(AVG(s.final_amount),0) as avg_order, MAX(s.created_at) as last_visit FROM sales s JOIN members m ON s.member_id=m.id WHERE s.created_at >= ? AND s.created_at < ? GROUP BY m.id ORDER BY total_spent DESC`
  memberRanking.value = await ipcRenderer.invoke('db-query', memberSql, [start, end])
  // 会员消费占比
  const memberRateSql = `SELECT IFNULL(SUM(final_amount),0) as memberAmount FROM sales WHERE member_id IS NOT NULL AND created_at >= ? AND created_at < ? AND payment_status != 'refunded'`
  const memberAmountRow = await ipcRenderer.invoke('db-get', memberRateSql, [start, end])
  reportData.value.memberConsumptionRate = reportData.value.totalRevenue > 0 ? ((memberAmountRow.memberAmount / reportData.value.totalRevenue) * 100).toFixed(1) : 0
  // 新增会员
  const newMemberSql = `SELECT COUNT(*) as newMembers FROM members WHERE created_at >= ? AND created_at < ?`
  const newMemberRow = await ipcRenderer.invoke('db-get', newMemberSql, [start, end])
  reportData.value.newMembers = newMemberRow.newMembers
  // 活跃会员
  const activeMemberSql = `SELECT COUNT(DISTINCT member_id) as activeMembers FROM sales WHERE created_at >= ? AND created_at < ? AND member_id IS NOT NULL`
  const activeMemberRow = await ipcRenderer.invoke('db-get', activeMemberSql, [start, end])
  reportData.value.activeMembers = activeMemberRow.activeMembers
  ElMessage.success('数据加载成功')
  nextTick(() => {
    initCharts()
  })
}

const exportReport = () => {
  ElMessage.info('导出功能开发中...')
}

const getLevelTagType = (level) => {
  switch (level) {
    case 'gold': return 'warning'
    case 'silver': return 'info'
    case 'bronze': return 'success'
    default: return 'info'
  }
}

const getLevelText = (level) => {
  switch (level) {
    case 'gold': return '黄金会员'
    case 'silver': return '白银会员'
    case 'bronze': return '青铜会员'
    default: return '普通会员'
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const initCharts = () => {
  // 这里应该初始化图表
  // 由于没有引入图表库，这里只是占位符
  console.log('初始化图表...')
}

onMounted(() => {
  loadReportData()
})
</script>

<style scoped>
.reports-page {
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

.time-selector {
  margin-bottom: 30px;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.metric-card.revenue::before {
  background: linear-gradient(90deg, #409eff, #67c23a);
}

.metric-card.orders::before {
  background: linear-gradient(90deg, #67c23a, #e6a23c);
}

.metric-card.customers::before {
  background: linear-gradient(90deg, #e6a23c, #f56c6c);
}

.metric-card.avg-order::before {
  background: linear-gradient(90deg, #f56c6c, #909399);
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  background: linear-gradient(135deg, #409eff, #67c23a);
}

.metric-content {
  flex: 1;
}

.metric-content h3 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: #333;
}

.metric-content p {
  color: #666;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
}

.metric-trend.up {
  color: #67c23a;
}

.metric-trend.down {
  color: #f56c6c;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  min-height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
  font-size: 14px;
}

.detailed-reports {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.table-container {
  margin-top: 20px;
}

.member-stats {
  padding: 20px 0;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}

.big-number {
  font-size: 36px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-item p {
  margin: 0;
  color: #666;
  font-size: 12px;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .time-selector .el-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .button-group {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>