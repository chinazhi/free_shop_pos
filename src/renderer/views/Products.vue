<template>
  <div class="products-page">
    <div class="page-header">
      <h2>商品管理</h2>
      <p>管理商品信息，查看商品库存和销售记录</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stats-card">
        <div class="stats-icon" style="background: #409eff">
          <el-icon><Box /></el-icon>
        </div>
        <div class="stats-content">
          <h3>{{ totalProducts }}</h3>
          <p>商品总数</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon" style="background: #67c23a">
          <el-icon><Check /></el-icon>
        </div>
        <div class="stats-content">
          <h3>{{ activeProducts }}</h3>
          <p>在售商品</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon" style="background: #e6a23c">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stats-content">
          <h3>{{ lowStockProducts }}</h3>
          <p>库存不足</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon" style="background: #f56c6c">
          <el-icon><Close /></el-icon>
        </div>
        <div class="stats-content">
          <h3>{{ outOfStockProducts }}</h3>
          <p>缺货商品</p>
        </div>
      </div>
    </div>

    <!-- 搜索和操作栏 -->
    <div class="search-bar">
      <el-row :gutter="20" align="middle">
        <el-col :span="5">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索商品名称或条码"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="selectedCategory"
            placeholder="选择分类"
            clearable
            @change="handleCategoryChange"
            style="width: 100%"
          >
            <el-option label="全部分类" value="" />
            <el-option
              v-for="category in productsStore.categories"
              :key="category.id"
              :label="category.name"
              :value="category.name"
            />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select v-model="stockFilter" placeholder="库存状态" clearable style="width: 100%">
            <el-option label="全部" value="" />
            <el-option label="正常" value="normal" />
            <el-option label="库存不足" value="low" />
            <el-option label="缺货" value="out" />
          </el-select>
        </el-col>
        <el-col :span="12">
          <div class="button-group">
            <el-button type="primary" @click="showAddDialog = true">
              <el-icon><Plus /></el-icon>
              添加商品
            </el-button>
            <el-button @click="handleImport">
              <el-icon><Upload /></el-icon>
              批量导入
            </el-button>
            <el-button @click="handleExport">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
            <el-button @click="showCategoryDialog = true">
              <el-icon><Setting /></el-icon>
              分类管理
            </el-button>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 商品表格 -->
    <div class="table-container">
      <el-table
        v-loading="productsStore.loading"
        :data="filteredProducts"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="barcode" label="条码" width="150" />
        <el-table-column prop="name" label="商品名称" min-width="200" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="price" label="售价" width="100" align="right">
          <template #default="{ row }">
            ¥{{ (row.price !== undefined && row.price !== null ? Number(row.price).toFixed(2) : '0.00') }}
          </template>
        </el-table-column>
        <el-table-column prop="cost" label="成本" width="100" align="right">
          <template #default="{ row }">
            ¥{{ (row.cost !== undefined && row.cost !== null ? Number(row.cost).toFixed(2) : '0.00') }}
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getStockTagType(row)"
              size="small"
            >
              {{ row.stock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="min_stock" label="最低库存" width="100" align="center" />
        <el-table-column prop="is_active" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.is_active === 1"
              @change="val => { row.is_active = val ? 1 : 0; handleStatusChange(row) }"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="editProduct(row)">
                编辑
              </el-button>
              <el-button type="warning" size="small" @click="adjustStock(row)">
                调库存
              </el-button>
              <el-button type="danger" size="small" @click="deleteProduct(row)">
                删除
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
          :total="filteredProducts.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 添加/编辑商品对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingProduct ? '编辑商品' : '添加商品'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="productFormRef"
        :model="productForm"
        :rules="productRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="条码" prop="barcode">
              <el-input v-model="productForm.barcode" placeholder="商品条码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="productForm.name" placeholder="商品名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="productForm.category" placeholder="选择分类" style="width: 100%">
                <el-option
                  v-for="category in productsStore.categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-switch v-model="productForm.is_active" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="售价" prop="price">
              <el-input-number
                v-model="productForm.price"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成本" prop="cost">
              <el-input-number
                v-model="productForm.cost"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="库存" prop="stock">
              <el-input-number
                v-model="productForm.stock"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最低库存" prop="min_stock">
              <el-input-number
                v-model="productForm.min_stock"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input
            v-model="productForm.description"
            type="textarea"
            :rows="3"
            placeholder="商品描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveProduct">保存</el-button>
      </template>
    </el-dialog>

    <!-- 库存调整对话框 -->
    <el-dialog
      v-model="showStockDialog"
      title="库存调整"
      width="400px"
    >
      <el-form label-width="100px">
        <el-form-item label="商品名称">
          <el-text>{{ stockAdjustProduct?.name }}</el-text>
        </el-form-item>
        <el-form-item label="当前库存">
          <el-text>{{ stockAdjustProduct?.stock }}</el-text>
        </el-form-item>
        <el-form-item label="调整类型">
          <el-radio-group v-model="stockAdjustType">
            <el-radio label="in">入库</el-radio>
            <el-radio label="out">出库</el-radio>
            <el-radio label="adjust">调整</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number
            v-model="stockAdjustQuantity"
            :min="stockAdjustType === 'out' ? 1 : (stockAdjustType === 'adjust' ? 0 : 1)"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="原因">
          <el-input
            v-model="stockAdjustReason"
            placeholder="调整原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStockDialog = false">取消</el-button>
        <el-button type="primary" @click="saveStockAdjust">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分类管理对话框 -->
    <el-dialog
      v-model="showCategoryDialog"
      title="分类管理"
      width="800px"
    >
      <div class="category-management">
        <div class="category-header">
          <el-button type="primary" @click="showAddCategoryDialog = true">
            <el-icon><Plus /></el-icon>
            添加分类
          </el-button>
        </div>
        
        <el-table
          :data="productsStore.categories"
          stripe
          border
          style="width: 100%; margin-top: 20px"
        >
          <el-table-column prop="name" label="分类名称" width="200" />
          <el-table-column prop="description" label="描述" />
          <el-table-column label="商品数量" width="120" align="center">
            <template #default="{ row }">
              {{ getProductCountByCategory(row.name) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" align="center">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="editCategory(row)">
                编辑
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="deleteCategory(row)"
                :disabled="getProductCountByCategory(row.name) > 0"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 添加/编辑分类对话框 -->
    <el-dialog
      v-model="showAddCategoryDialog"
      :title="editingCategory ? '编辑分类' : '添加分类'"
      width="400px"
      @close="resetCategoryForm"
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddCategoryDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'
import { useProductsStore } from '../stores/products'

const productsStore = useProductsStore()

// 响应式数据
const searchKeyword = ref('')
const selectedCategory = ref('')
const stockFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const selectedProducts = ref([])
const showAddDialog = ref(false)
const showStockDialog = ref(false)
const showCategoryDialog = ref(false)
const showAddCategoryDialog = ref(false)
const editingProduct = ref(null)
const editingCategory = ref(null)
const stockAdjustProduct = ref(null)
const stockAdjustType = ref('in')
const stockAdjustQuantity = ref(0)
const stockAdjustReason = ref('')

// 表单数据
const productForm = reactive({
  barcode: '',
  name: '',
  category: '',
  price: 0,
  cost: 0,
  stock: 0,
  min_stock: 0,
  description: '',
  is_active: 0
})

const categoryForm = reactive({
  name: '',
  description: ''
})

// 表单验证规则
const productRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入售价', trigger: 'blur' }],
  cost: [{ required: true, message: '请输入成本', trigger: 'blur' }]
}

const categoryRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

const productFormRef = ref()
const categoryFormRef = ref()

// 计算属性
const filteredProducts = computed(() => {
  let products = productsStore.products
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    products = products.filter(p => 
      p.name.toLowerCase().includes(keyword) ||
      p.barcode?.includes(keyword)
    )
  }
  
  // 分类过滤
  if (selectedCategory.value) {
    products = products.filter(p => p.category === selectedCategory.value)
  }
  
  // 库存状态过滤
  if (stockFilter.value) {
    switch (stockFilter.value) {
      case 'normal':
        products = products.filter(p => p.stock > p.min_stock)
        break
      case 'low':
        products = products.filter(p => p.stock <= p.min_stock && p.stock > 0)
        break
      case 'out':
        products = products.filter(p => p.stock === 0)
        break
    }
  }
  
  return products
})

const totalProducts = computed(() => productsStore.products.length)
const activeProducts = computed(() => productsStore.products.length)
const lowStockProducts = computed(() => productsStore.lowStockProducts.length)
const outOfStockProducts = computed(() => productsStore.products.filter(p => p.stock === 0).length)

// 方法
const handleSearch = () => {
  currentPage.value = 1
}

const handleCategoryChange = () => {
  currentPage.value = 1
}

const handleSelectionChange = (selection) => {
  selectedProducts.value = selection
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

const getStockTagType = (product) => {
  if (product.stock === 0) return 'danger'
  if (product.stock <= product.min_stock) return 'warning'
  return 'success'
}

const handleStatusChange = async (product) => {
  console.log('[handleStatusChange] 触发，product:', JSON.parse(JSON.stringify(product)))
  if (!product || typeof product.id === 'undefined') return;
  try {
    await productsStore.updateProduct(product.id, { is_active: product.is_active })
    console.log('[handleStatusChange] 状态更新成功', product)
    ElMessage.success('状态更新成功')
  } catch (error) {
    console.error('[handleStatusChange] 状态更新失败', error)
    ElMessage.error('状态更新失败')
    product.is_active = product.is_active === 1 ? 0 : 1 // 回滚
  }
}

const editProduct = (product) => {
  editingProduct.value = product
  Object.assign(productForm, {
    ...product,
    is_active: product.is_active === 1  // 转换为布尔值
  })
  showAddDialog.value = true
}

const deleteProduct = async (product) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除商品 "${product.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await productsStore.deleteProduct(product.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const adjustStock = (product) => {
  stockAdjustProduct.value = product
  stockAdjustType.value = 'in'
  stockAdjustQuantity.value = 0
  stockAdjustReason.value = ''
  showStockDialog.value = true
}

const resetForm = () => {
  editingProduct.value = null
  Object.assign(productForm, {
    barcode: '',
    name: '',
    category: '',
    price: 0,
    cost: 0,
    stock: 0,
    min_stock: 0,
    description: '',
    is_active: 1
  })
  productFormRef.value?.resetFields()
}

const saveProduct = async () => {
  try {
    await productFormRef.value.validate()
    
    const productData = {
      ...productForm,
      is_active: productForm.is_active ? 1 : 0  // 转换为数值
    }
    
    if (editingProduct.value) {
      await productsStore.updateProduct(editingProduct.value.id, productData)
      ElMessage.success('商品更新成功')
    } else {
      await productsStore.addProduct(productData)
      ElMessage.success('商品添加成功')
    }
    
    showAddDialog.value = false
    resetForm()
  } catch (error) {
    if (error !== false) { // 不是表单验证错误
      console.error('商品保存失败:', error)
      const errorMessage = error.message || error.toString() || '保存失败'
      ElMessage.error('保存失败: ' + errorMessage)
    }
  }
}

const saveStockAdjust = async () => {
  try {
    if (!stockAdjustQuantity.value) {
      ElMessage.warning('请输入调整数量')
      return
    }
    
    await productsStore.updateStock(
      stockAdjustProduct.value.id,
      stockAdjustQuantity.value,
      stockAdjustType.value,
      stockAdjustReason.value || '手动调整',
      '管理员'
    )
    
    ElMessage.success('库存调整成功')
    showStockDialog.value = false
  } catch (error) {
    ElMessage.error(error.message || '库存调整失败')
  }
}

const handleImport = () => {
  ElMessage.info('批量导入功能开发中...')
}

const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

// 分类管理相关方法
const getProductCountByCategory = (categoryName) => {
  return productsStore.products.filter(p => p.category === categoryName).length
}

const editCategory = (category) => {
  editingCategory.value = category
  Object.assign(categoryForm, category)
  showAddCategoryDialog.value = true
}

const deleteCategory = async (category) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类 "${category.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await productsStore.deleteCategory(category.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const resetCategoryForm = () => {
  editingCategory.value = null
  Object.assign(categoryForm, {
    name: '',
    description: ''
  })
  categoryFormRef.value?.resetFields()
}

const saveCategory = async () => {
  try {
    await categoryFormRef.value.validate()
    
    if (editingCategory.value) {
      await productsStore.updateCategory(editingCategory.value.id, categoryForm)
      ElMessage.success('分类更新成功')
    } else {
      await productsStore.addCategory(categoryForm)
      ElMessage.success('分类添加成功')
    }
    
    showAddCategoryDialog.value = false
    resetCategoryForm()
  } catch (error) {
    if (error !== false) { // 不是表单验证错误
      console.error('分类保存失败:', error)
      const errorMessage = error.message || error.toString() || '保存失败'
      ElMessage.error('保存失败: ' + errorMessage)
    }
  }
}

onMounted(async () => {
  await productsStore.loadCategories()
  await productsStore.loadProducts()
  // 检查商品数据完整性，自动修复缺失字段
  productsStore.products.forEach((p, idx) => {
    if (!p.barcode) p.barcode = ''
    if (!p.name) p.name = ''
    if (!p.category) p.category = ''
    if (typeof p.is_active === 'undefined') p.is_active = 1
    if (typeof p.price === 'undefined') p.price = 0
    if (typeof p.cost === 'undefined') p.cost = 0
    if (typeof p.stock === 'undefined') p.stock = 0
    if (typeof p.min_stock === 'undefined') p.min_stock = 0
    if (typeof p.description === 'undefined') p.description = ''
  })
  console.log('[onMounted] productsStore.products:', JSON.parse(JSON.stringify(productsStore.products)))
})
</script>

<style scoped>
.products-page {
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

.search-bar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.button-group {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  flex-wrap: nowrap;
  min-height: 32px;
  align-items: center;
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

.action-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
}

.el-table {
  border-radius: 8px;
  overflow: hidden;
}

.el-dialog .el-form {
  padding: 0 20px;
}

@media (max-width: 576px) {
  .search-bar {
    padding: 15px;
  }
  
  .search-bar .el-col {
    margin-bottom: 15px;
  }
  
  .button-group {
    justify-content: center;
    margin-top: 15px;
  }
}

@media (max-width: 768px) {
  .search-bar .el-col {
    margin-bottom: 12px;
  }
  
  .button-group {
    justify-content: flex-start;
    margin-top: 12px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 992px) {
  .button-group {
    margin-top: 10px;
    justify-content: flex-start;
  }
}

@media (min-width: 993px) and (max-width: 1200px) {
  .button-group {
    gap: 6px;
  }
  
  .button-group .el-button {
    padding: 8px 12px;
    font-size: 13px;
  }
}

/* 分类管理样式 */
.category-management {
  padding: 0;
}

.category-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.category-management .el-table {
  border-radius: 8px;
  overflow: hidden;
}

.category-management .el-dialog__body {
  padding: 20px;
}
</style>