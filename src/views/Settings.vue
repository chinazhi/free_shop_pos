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
                  v-model="receiptForm.receiptHeader"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入小票页眉内容"
                />
              </el-form-item>
              <el-form-item label="小票页脚">
                <el-input
                  v-model="receiptForm.receiptFooter"
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
                  {{ receiptForm.receiptHeader || basicForm.storeName }}
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
                  {{ receiptForm.receiptFooter || '谢谢惠顾，欢迎再次光临！' }}
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



        <!-- 系统设置 -->
        <el-tab-pane label="系统设置" name="system">
          <div class="settings-section">
            <h3>界面设置</h3>
            <el-form label-width="120px">
              <el-form-item label="主题色彩">
                <el-color-picker v-model="systemForm.themeColor" />
              </el-form-item>
              <el-form-item label="字体大小">
                <el-select v-model="systemForm.fontSize" placeholder="选择字体大小">
                  <el-option label="小 (14px)" value="sm" />
                  <el-option label="标准 (16px)" value="md" />
                  <el-option label="大 (18px)" value="lg" />
                  <el-option label="特大 (20px)" value="xl" />
                </el-select>
                <div class="font-size-preview" :class="`font-size-${systemForm.fontSize}`">
                  预览文字效果 - 便利店收银系统
                </div>
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
              <el-button type="info" @click="initializeDatabase">
                <el-icon><Refresh /></el-icon>
                初始化系统数据库
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


  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Tools } from '@element-plus/icons-vue'
import { useAppStore } from '../stores/app'
import dbManager from '../utils/indexedDB'

const appStore = useAppStore()

// 响应式数据
const activeTab = ref('basic')

// 表单引用
const basicFormRef = ref()

// 基本设置表单
const basicForm = reactive({})
// 税务设置表单
const taxForm = reactive({})
// 小票设置表单
const receiptForm = reactive({})
// 系统设置表单
const systemForm = reactive({})

// 表单验证规则
const basicRules = {
  storeName: [{ required: true, message: '请输入商店名称', trigger: 'blur' }]
}

// 保存基本设置
const saveBasicSettings = async () => {
  try {
    await basicFormRef.value.validate()
    await appStore.updateSettings({
      shopName: basicForm.storeName,
      storeAddress: basicForm.storeAddress,
      storePhone: basicForm.storePhone,
      businessHours: basicForm.businessHours,
      storeDescription: basicForm.storeDescription,
      currency: basicForm.currency,
      decimalPlaces: basicForm.decimalPlaces
    })
    ElMessage.success('基本设置保存成功')
  } catch {
    ElMessage.error('请检查输入信息')
  }
}

// 保存税务设置
const saveTaxSettings = async () => {
  await appStore.updateSettings({
    enableTax: taxForm.enableTax,
    taxRate: taxForm.defaultTaxRate / 100, // 转换为小数
    taxNumber: taxForm.taxNumber,
    taxName: taxForm.taxName
  })
  ElMessage.success('税务设置保存成功')
}

// 保存小票设置
const saveReceiptSettings = async () => {
  await appStore.updateSettings({
    autoPrint: receiptForm.autoPrint,
    paperWidth: receiptForm.paperWidth,
    receiptHeader: receiptForm.receiptHeader,
    receiptFooter: receiptForm.receiptFooter,
    showBarcode: receiptForm.showBarcode,
    showCashier: receiptForm.showCashier
  })
  ElMessage.success('小票设置保存成功')
}



// 保存系统设置
const saveSystemSettings = async () => {
  await appStore.updateSettings({
    themeColor: systemForm.themeColor,
    fontSize: systemForm.fontSize,
    language: systemForm.language,
    timeFormat: systemForm.timeFormat,
    autoBackup: systemForm.autoBackup,
    backupFrequency: systemForm.backupFrequency,
    dataRetention: systemForm.dataRetention
  })
  // 应用字体大小到全局
  applyFontSize(systemForm.fontSize)
  ElMessage.success('系统设置保存成功')
}

// 重置基本设置为默认值
const resetBasicSettings = () => {
  Object.assign(basicForm, appStore.settings)
  ElMessage.success('设置已重置')
}

// 测试打印功能
const testPrint = () => {
  ElMessage.info('测试打印功能开发中...')
}


// 应用字体大小到全局
const applyFontSize = (fontSize) => {
  const root = document.documentElement
  // 移除之前的字体大小类
  root.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg', 'font-size-xl')
  // 添加新的字体大小类
  if (fontSize) {
    root.classList.add(`font-size-${fontSize}`)
  }
}

// 初始化数据库
function initializeDatabase() {
  ElMessageBox.confirm('确定要初始化数据库吗？此操作不可恢复！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await dbManager.init();
      
      // 清空所有数据表
      const stores = ['products', 'categories', 'sales', 'sale_items', 'settings'];
      for (const storeName of stores) {
        const transaction = dbManager.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await store.clear();
      }
      
      // 重新初始化默认数据
      await dbManager.initDefaultData();
      
      ElMessage.success('数据库已初始化');
      appStore.loadSettings();
      location.reload();
    } catch (error) {
      console.error('初始化数据库失败:', error);
      ElMessage.error('初始化数据库失败');
    }
  }).catch(() => {
    // 用户点击取消，不做任何处理
  });
}

// 组件挂载时加载设置
onMounted(async () => {
  await appStore.loadSettings()
  // 初始化基本设置表单
  Object.assign(basicForm, {
    storeName: appStore.settings.shopName || '糖果便利店',
    storeAddress: appStore.settings.storeAddress,
    storePhone: appStore.settings.storePhone,
    businessHours: appStore.settings.businessHours,
    storeDescription: appStore.settings.storeDescription,
    currency: appStore.settings.currency || 'CNY',
    decimalPlaces: appStore.settings.decimalPlaces || 2
  })
  // 初始化税务设置表单
  Object.assign(taxForm, {
    enableTax: appStore.settings.enableTax || false,
    defaultTaxRate: typeof appStore.settings.taxRate === 'number' ? appStore.settings.taxRate * 100 : 0,
    taxNumber: appStore.settings.taxNumber,
    taxName: appStore.settings.taxName
  })
  // 初始化小票设置表单
  Object.assign(receiptForm, {
    autoPrint: appStore.settings.autoPrint,
    paperWidth: appStore.settings.paperWidth,
    receiptHeader: appStore.settings.receiptHeader,
    receiptFooter: appStore.settings.receiptFooter,
    showBarcode: appStore.settings.showBarcode,
    showCashier: appStore.settings.showCashier
  })

  // 初始化系统设置表单
  Object.assign(systemForm, {
    themeColor: appStore.settings.themeColor || '#ffffff',
    fontSize: appStore.settings.fontSize || 'md',
    language: appStore.settings.language || 'zh-CN',
    timeFormat: appStore.settings.timeFormat || '24',
    autoBackup: appStore.settings.autoBackup,
    backupFrequency: appStore.settings.backupFrequency,
    dataRetention: appStore.settings.dataRetention
  })
  
  // 应用当前字体大小设置
  applyFontSize(systemForm.fontSize)
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

/* 字体大小预览样式 */
.font-size-preview {
  margin-top: 10px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  color: #606266;
  transition: font-size 0.3s ease;
}

.font-size-preview.font-size-sm {
  font-size: 14px;
}

.font-size-preview.font-size-md {
  font-size: 16px;
}

.font-size-preview.font-size-lg {
  font-size: 18px;
}

.font-size-preview.font-size-xl {
  font-size: 20px;
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