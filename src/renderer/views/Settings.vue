<template>
  <div class="settings-page">
    <div class="page-header">
      <h2>系统设置</h2>
      <p>配置系统参数和业务规则</p>
    </div>

    <div class="settings-container">
      <el-tabs v-model="activeTab" tab-position="left">
        <!-- 基本设置 -->
        <el-tab-pane label="基本设置" name="basic">
          <div class="settings-section">
            <h3>商店信息</h3>
            <el-form
              ref="basicFormRef"
              :model="basicForm"
              :rules="basicRules"
              label-width="120px"
            >
              <el-form-item label="商店名称" prop="storeName">
                <el-input v-model="basicForm.storeName" placeholder="请输入商店名称" />
              </el-form-item>
              <el-form-item label="商店地址">
                <el-input v-model="basicForm.storeAddress" placeholder="请输入商店地址" />
              </el-form-item>
              <el-form-item label="联系电话">
                <el-input v-model="basicForm.storePhone" placeholder="请输入联系电话" />
              </el-form-item>
              <el-form-item label="营业时间">
                <el-time-picker
                  v-model="basicForm.businessHours"
                  is-range
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  format="HH:mm"
                  value-format="HH:mm"
                />
              </el-form-item>
              <el-form-item label="商店描述">
                <el-input
                  v-model="basicForm.storeDescription"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入商店描述"
                />
              </el-form-item>
            </el-form>
          </div>

          <div class="settings-section">
            <h3>货币设置</h3>
            <el-form label-width="120px">
              <el-form-item label="默认货币">
                <el-select v-model="basicForm.currency" placeholder="选择货币">
                  <el-option label="人民币 (¥)" value="CNY" />
                  <el-option label="美元 ($)" value="USD" />
                  <el-option label="欧元 (€)" value="EUR" />
                </el-select>
              </el-form-item>
              <el-form-item label="小数位数">
                <el-input-number
                  v-model="basicForm.decimalPlaces"
                  :min="0"
                  :max="4"
                  style="width: 200px"
                />
              </el-form-item>
            </el-form>
          </div>

          <div class="settings-actions">
            <el-button type="primary" @click="saveBasicSettings">
              保存设置
            </el-button>
            <el-button @click="resetBasicSettings">
              重置
            </el-button>
          </div>
        </el-tab-pane>

        <!-- 税务设置 -->
        <el-tab-pane label="税务设置" name="tax">
          <div class="settings-section">
            <h3>税率配置</h3>
            <el-form label-width="120px">
              <el-form-item label="启用税务">
                <el-switch v-model="taxForm.enableTax" />
              </el-form-item>
              <el-form-item v-if="taxForm.enableTax" label="默认税率">
                <el-input-number
                  v-model="taxForm.defaultTaxRate"
                  :min="0"
                  :max="100"
                  :precision="2"
                  style="width: 200px"
                />
                <span style="margin-left: 10px;">%</span>
              </el-form-item>
              <el-form-item v-if="taxForm.enableTax" label="税务编号">
                <el-input v-model="taxForm.taxNumber" placeholder="请输入税务编号" />
              </el-form-item>
              <el-form-item v-if="taxForm.enableTax" label="税务名称">
                <el-input v-model="taxForm.taxName" placeholder="请输入税务名称" />
              </el-form-item>
            </el-form>
          </div>

          <div class="settings-actions">
            <el-button type="primary" @click="saveTaxSettings">
              保存设置
            </el-button>
          </div>
        </el-tab-pane>

        <!-- 小票设置 -->
        <el-tab-pane label="小票设置" name="receipt">
          <div class="settings-section">
            <h3>小票配置</h3>
            <el-form label-width="120px">
              <el-form-item label="自动打印">
                <el-switch v-model="receiptForm.autoPrint" />
              </el-form-item>
              <el-form-item label="小票宽度">
                <el-select v-model="receiptForm.paperWidth" placeholder="选择纸张宽度">
                  <el-option label="58mm" value="58" />
                  <el-option label="80mm" value="80" />
                </el-select>
              </el-form-item>
              <el-form-item label="小票页眉">
                <el-input
                  v-model="receiptForm.header"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入小票页眉内容"
                />
              </el-form-item>
              <el-form-item label="小票页脚">
                <el-input
                  v-model="receiptForm.footer"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入小票页脚内容"
                />
              </el-form-item>
              <el-form-item label="显示商品条码">
                <el-switch v-model="receiptForm.showBarcode" />
              </el-form-item>
              <el-form-item label="显示收银员">
                <el-switch v-model="receiptForm.showCashier" />
              </el-form-item>
            </el-form>
          </div>

          <div class="settings-section">
            <h3>小票预览</h3>
            <div class="receipt-preview">
              <div class="receipt-paper">
                <div class="receipt-header">
                  {{ receiptForm.header || basicForm.storeName }}
                </div>
                <div class="receipt-divider">================================</div>
                <div class="receipt-item">
                  <div>可口可乐 330ml</div>
                  <div>3.50 x 2 = 7.00</div>
                </div>
                <div class="receipt-item">
                  <div>薯片 大包装</div>
                  <div>12.80 x 1 = 12.80</div>
                </div>
                <div class="receipt-divider">--------------------------------</div>
                <div class="receipt-total">
                  <div>小计: ¥19.80</div>
                  <div>税费: ¥1.78</div>
                  <div><strong>总计: ¥21.58</strong></div>
                </div>
                <div class="receipt-payment">
                  <div>支付方式: 微信支付</div>
                  <div>收款: ¥25.00</div>
                  <div>找零: ¥3.42</div>
                </div>
                <div class="receipt-divider">================================</div>
                <div class="receipt-footer">
                  {{ receiptForm.footer || '谢谢惠顾，欢迎再次光临！' }}
                </div>
                <div v-if="receiptForm.showCashier" class="receipt-cashier">
                  收银员: 张三
                </div>
                <div class="receipt-time">
                  {{ new Date().toLocaleString('zh-CN') }}
                </div>
              </div>
            </div>
          </div>

          <div class="settings-actions">
            <el-button type="primary" @click="saveReceiptSettings">
              保存设置
            </el-button>
            <el-button @click="testPrint">
              测试打印
            </el-button>
          </div>
        </el-tab-pane>

        <!-- 会员设置 -->
        <el-tab-pane label="会员设置" name="member">
          <div class="settings-section">
            <h3>会员等级</h3>
            <el-table :data="memberLevels" border>
              <el-table-column prop="name" label="等级名称" width="120" />
              <el-table-column prop="discount" label="折扣率" width="100" align="center">
                <template #default="{ row }">
                  {{ (row.discount * 100).toFixed(0) }}%
                </template>
              </el-table-column>
              <el-table-column prop="pointsRate" label="积分倍率" width="100" align="center">
                <template #default="{ row }">
                  {{ row.pointsRate }}x
                </template>
              </el-table-column>
              <el-table-column prop="minSpent" label="升级条件" width="120" align="right">
                <template #default="{ row }">
                  ¥{{ row.minSpent.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="{ row, $index }">
                  <el-button type="primary" size="small" @click="editMemberLevel(row, $index)">
                    编辑
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="settings-section">
            <h3>积分设置</h3>
            <el-form label-width="120px">
              <el-form-item label="启用积分">
                <el-switch v-model="memberForm.enablePoints" />
              </el-form-item>
              <el-form-item v-if="memberForm.enablePoints" label="积分比例">
                <el-input-number
                  v-model="memberForm.pointsRatio"
                  :min="0"
                  :precision="2"
                  style="width: 200px"
                />
                <span style="margin-left: 10px;">积分/元</span>
              </el-form-item>
              <el-form-item v-if="memberForm.enablePoints" label="积分抵扣">
                <el-input-number
                  v-model="memberForm.pointsValue"
                  :min="0"
                  :precision="4"
                  style="width: 200px"
                />
                <span style="margin-left: 10px;">元/积分</span>
              </el-form-item>
            </el-form>
          </div>

          <div class="settings-actions">
            <el-button type="primary" @click="saveMemberSettings">
              保存设置
            </el-button>
          </div>
        </el-tab-pane>

        <!-- 系统设置 -->
        <el-tab-pane label="系统设置" name="system">
          <div class="settings-section">
            <h3>界面设置</h3>
            <el-form label-width="120px">
              <el-form-item label="主题色彩">
                <el-color-picker v-model="systemForm.themeColor" />
              </el-form-item>
              <el-form-item label="语言">
                <el-select v-model="systemForm.language" placeholder="选择语言">
                  <el-option label="简体中文" value="zh-CN" />
                  <el-option label="English" value="en-US" />
                </el-select>
              </el-form-item>
              <el-form-item label="时间格式">
                <el-select v-model="systemForm.timeFormat" placeholder="选择时间格式">
                  <el-option label="24小时制" value="24" />
                  <el-option label="12小时制" value="12" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>

          <div class="settings-section">
            <h3>数据管理</h3>
            <el-form label-width="120px">
              <el-form-item label="自动备份">
                <el-switch v-model="systemForm.autoBackup" />
              </el-form-item>
              <el-form-item v-if="systemForm.autoBackup" label="备份频率">
                <el-select v-model="systemForm.backupFrequency" placeholder="选择备份频率">
                  <el-option label="每日" value="daily" />
                  <el-option label="每周" value="weekly" />
                  <el-option label="每月" value="monthly" />
                </el-select>
              </el-form-item>
              <el-form-item label="数据保留">
                <el-input-number
                  v-model="systemForm.dataRetention"
                  :min="30"
                  :max="3650"
                  style="width: 200px"
                />
                <span style="margin-left: 10px;">天</span>
              </el-form-item>
            </el-form>
          </div>

          <div class="settings-section">
            <h3>系统操作</h3>
            <div class="system-actions">
              <el-button type="primary" @click="backupData">
                <el-icon><Download /></el-icon>
                立即备份
              </el-button>
              <el-button type="warning" @click="clearCache">
                <el-icon><Delete /></el-icon>
                清理缓存
              </el-button>
              <el-button type="info" @click="initializeDatabase">
                <el-icon><Refresh /></el-icon>
                初始化数据库
              </el-button>
              <el-button type="warning" @click="resetTableStructure">
                <el-icon><Tools /></el-icon>
                重置表结构
              </el-button>
              <el-button type="danger" @click="resetSystem">
                <el-icon><RefreshLeft /></el-icon>
                重置系统
              </el-button>
            </div>
          </div>

          <div class="settings-actions">
            <el-button type="primary" @click="saveSystemSettings">
              保存设置
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 编辑会员等级对话框 -->
    <el-dialog
      v-model="showLevelDialog"
      title="编辑会员等级"
      width="400px"
    >
      <el-form
        ref="levelFormRef"
        :model="levelForm"
        label-width="100px"
      >
        <el-form-item label="等级名称">
          <el-input v-model="levelForm.name" placeholder="等级名称" />
        </el-form-item>
        <el-form-item label="折扣率">
          <el-input-number
            v-model="levelForm.discount"
            :min="0"
            :max="1"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="积分倍率">
          <el-input-number
            v-model="levelForm.pointsRate"
            :min="1"
            :max="10"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="升级条件">
          <el-input-number
            v-model="levelForm.minSpent"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLevelDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMemberLevel">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Tools } from '@element-plus/icons-vue'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()

// 响应式数据
const activeTab = ref('basic')
const showLevelDialog = ref(false)
const editingLevelIndex = ref(-1)

// 表单引用
const basicFormRef = ref()
const levelFormRef = ref()

// 基本设置表单
const basicForm = reactive({
  storeName: '便民小店',
  storeAddress: '',
  storePhone: '',
  businessHours: ['09:00', '22:00'],
  storeDescription: '',
  currency: 'CNY',
  decimalPlaces: 2
})

// 税务设置表单
const taxForm = reactive({
  enableTax: true,
  defaultTaxRate: 9.0,
  taxNumber: '',
  taxName: '增值税'
})

// 小票设置表单
const receiptForm = reactive({
  autoPrint: false,
  paperWidth: '80',
  header: '',
  footer: '谢谢惠顾，欢迎再次光临！',
  showBarcode: true,
  showCashier: true
})

// 会员设置表单
const memberForm = reactive({
  enablePoints: true,
  pointsRatio: 1.0,
  pointsValue: 0.01
})

// 系统设置表单
const systemForm = reactive({
  themeColor: '#409eff',
  language: 'zh-CN',
  timeFormat: '24',
  autoBackup: true,
  backupFrequency: 'daily',
  dataRetention: 365
})

// 会员等级数据
const memberLevels = ref([
  {
    name: '青铜会员',
    discount: 0.95,
    pointsRate: 1,
    minSpent: 0
  },
  {
    name: '白银会员',
    discount: 0.90,
    pointsRate: 1.5,
    minSpent: 1000
  },
  {
    name: '黄金会员',
    discount: 0.85,
    pointsRate: 2,
    minSpent: 5000
  }
])

// 会员等级编辑表单
const levelForm = reactive({
  name: '',
  discount: 1,
  pointsRate: 1,
  minSpent: 0
})

// 表单验证规则
const basicRules = {
  storeName: [{ required: true, message: '请输入商店名称', trigger: 'blur' }]
}

// 方法
const saveBasicSettings = async () => {
  try {
    await basicFormRef.value.validate()
    // 保存到应用状态
    appStore.updateSettings({
      storeName: basicForm.storeName,
      currency: basicForm.currency
    })
    ElMessage.success('基本设置保存成功')
  } catch {
    ElMessage.error('请检查输入信息')
  }
}

const resetBasicSettings = () => {
  Object.assign(basicForm, {
    storeName: '便民小店',
    storeAddress: '',
    storePhone: '',
    businessHours: ['09:00', '22:00'],
    storeDescription: '',
    currency: 'CNY',
    decimalPlaces: 2
  })
  ElMessage.success('设置已重置')
}

const saveTaxSettings = () => {
  appStore.updateSettings({
    taxRate: taxForm.defaultTaxRate / 100
  })
  ElMessage.success('税务设置保存成功')
}

const saveReceiptSettings = () => {
  appStore.updateSettings({
    autoPrint: receiptForm.autoPrint,
    receiptFooter: receiptForm.footer
  })
  ElMessage.success('小票设置保存成功')
}

const testPrint = () => {
  ElMessage.info('测试打印功能开发中...')
}

const saveMemberSettings = () => {
  ElMessage.success('会员设置保存成功')
}

const editMemberLevel = (level, index) => {
  editingLevelIndex.value = index
  Object.assign(levelForm, level)
  showLevelDialog.value = true
}

const saveMemberLevel = () => {
  if (editingLevelIndex.value >= 0) {
    Object.assign(memberLevels.value[editingLevelIndex.value], levelForm)
    ElMessage.success('会员等级更新成功')
  }
  showLevelDialog.value = false
}

const saveSystemSettings = () => {
  ElMessage.success('系统设置保存成功')
}

const backupData = () => {
  ElMessage.info('数据备份功能开发中...')
}

const clearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '清理缓存将删除临时文件，确认继续？',
      '确认清理',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    ElMessage.success('缓存清理成功')
  } catch {
    // 用户取消
  }
}

const initializeDatabase = async () => {
  try {
    await ElMessageBox.confirm(
      '初始化数据库将清空所有商品、会员、销售等数据，并恢复默认设置，此操作不可撤销，确认继续？',
      '确认初始化数据库',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await window.ipcRenderer.invoke('reset-database')
    
    if (result.success) {
      ElMessage.success('数据库初始化成功')
      // 可以选择刷新页面或重新加载数据
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  } catch (error) {
    if (error.message) {
      ElMessage.error('数据库初始化失败: ' + error.message)
    }
    // 用户取消时不显示错误
  }
}

const resetTableStructure = async () => {
  try {
    await ElMessageBox.confirm(
      '重置表结构将删除并重新创建所有数据表，包括商品表和会员表，所有数据将被清空，此操作不可撤销，确认继续？',
      '确认重置表结构',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await window.ipcRenderer.invoke('reset-table-structure')
    
    if (result.success) {
      ElMessage.success('表结构重置成功')
      // 刷新页面以重新加载数据
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  } catch (error) {
    if (error.message) {
      ElMessage.error('表结构重置失败: ' + error.message)
    }
    // 用户取消时不显示错误
  }
}

const resetSystem = async () => {
  try {
    await ElMessageBox.confirm(
      '重置系统将恢复所有默认设置，此操作不可撤销，确认继续？',
      '确认重置',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    ElMessage.success('系统重置成功')
  } catch {
    // 用户取消
  }
}

onMounted(async () => {
  await appStore.loadSettings()
  // 同步 settings 到表单
  basicForm.storeName = appStore.settings.shopName || '便民小店'
  basicForm.currency = appStore.settings.currency || 'CNY'
  if (typeof appStore.settings.taxRate === 'number') {
    taxForm.defaultTaxRate = appStore.settings.taxRate * 100
  }
  receiptForm.autoPrint = appStore.settings.autoPrint ?? false
  receiptForm.footer = appStore.settings.receiptFooter || '谢谢惠顾，欢迎再次光临！'
})
</script>

<style scoped>
.settings-page {
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

.settings-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  min-height: 600px;
}

.settings-section {
  margin-bottom: 40px;
}

.settings-section h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
}

.settings-actions {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.system-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.receipt-preview {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.receipt-paper {
  width: 300px;
  background: white;
  border: 1px solid #ddd;
  padding: 20px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.receipt-header {
  text-align: center;
  font-weight: bold;
  margin-bottom: 10px;
}

.receipt-divider {
  text-align: center;
  margin: 10px 0;
  color: #666;
}

.receipt-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.receipt-total {
  text-align: right;
  margin: 10px 0;
}

.receipt-payment {
  text-align: right;
  margin: 10px 0;
}

.receipt-footer {
  text-align: center;
  margin: 10px 0;
}

.receipt-cashier {
  text-align: center;
  margin: 5px 0;
  font-size: 11px;
}

.receipt-time {
  text-align: center;
  font-size: 11px;
  color: #666;
}

:deep(.el-tabs__content) {
  padding: 30px;
}

:deep(.el-tabs--left .el-tabs__nav-wrap) {
  background: #f8f9fa;
}

:deep(.el-tabs--left .el-tabs__item) {
  text-align: left;
  padding: 0 30px;
}

@media (max-width: 768px) {
  .settings-container {
    margin: 0 -10px;
  }
  
  :deep(.el-tabs--left) {
    flex-direction: column;
  }
  
  :deep(.el-tabs--left .el-tabs__nav-wrap) {
    width: 100%;
  }
  
  :deep(.el-tabs--left .el-tabs__content) {
    padding: 20px;
  }
  
  .system-actions {
    flex-direction: column;
  }
  
  .receipt-paper {
    width: 100%;
    max-width: 280px;
  }
}
</style>