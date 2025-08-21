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

    <!-- 搜索和筛选栏 -->
    <div class="search-filter-container">
      <!-- 筛选条件区域 -->
      <div class="filter-section">
        <div class="filter-item">
          <label class="filter-label">商品搜索：</label>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索商品名称或条码"
            clearable
            size="default"
            class="search-input"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="filter-item">
          <label class="filter-label">商品分类：</label>
          <el-select
            v-model="selectedCategory"
            placeholder="分类筛选"
            clearable
            size="default"
            class="category-select"
            @change="handleCategoryChange"
          >
            <el-option label="全部分类" value="" />
            <el-option
              v-for="category in productsStore.categories"
              :key="category.id"
              :label="category.name"
              :value="category.name"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <label class="filter-label">库存状态：</label>
          <el-select 
            v-model="stockFilter" 
            placeholder="库存状态" 
            clearable 
            size="default"
            class="stock-select"
          >
            <el-option label="全部" value="" />
            <el-option label="正常" value="normal" />
            <el-option label="库存不足" value="low" />
            <el-option label="缺货" value="out" />
          </el-select>
        </div>
        <div class="filter-item action-item">
          <el-button 
            type="primary" 
            size="default"
            @click="showAddDialog = true"
            class="primary-button"
          >
            <el-icon><Plus /></el-icon>
            新增商品
          </el-button>
        </div>
        <div class="filter-item">
          <el-button 
            size="default"
            @click="handleImport"
            class="action-button"
          >
            <el-icon><Upload /></el-icon>
            导入
          </el-button>
        </div>
        <div class="filter-item">
          <el-button 
            size="default"
            @click="handleExport"
            class="action-button"
          >
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
        <div class="filter-item">
          <el-button 
            size="default"
            @click="showCategoryDialog = true"
            class="action-button"
          >
            <el-icon><Setting /></el-icon>
            分类管理
          </el-button>
        </div>
      </div>
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
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            {{ getCategoryName(row.category_id) }}
          </template>
        </el-table-column>
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
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="productForm.description"
            type="textarea"
            :rows="3"
            placeholder="商品描述（可选）"
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
        label-width="100px"
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
  stock: 10,           // 默认库存10件
  min_stock: 2,        // 默认最低库存5件
  description: '',
  is_active: true      // 默认激活状态
})

const categoryForm = reactive({
  name: '',
  description: ''
})

// 表单验证规则
const productRules = {
  barcode: [
    { required: true, message: '请输入商品条码', trigger: 'blur' },
    { min: 1, message: '条码不能为空', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 1, message: '商品名称不能为空', trigger: 'blur' }
  ],
  category: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  price: [
    { required: true, message: '请输入售价', trigger: 'blur' },
    { type: 'number', min: 0, message: '售价不能小于0', trigger: 'blur' }
  ],
  cost: [
    { required: true, message: '请输入成本', trigger: 'blur' },
    { type: 'number', min: 0, message: '成本不能小于0', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入库存数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '库存不能小于0', trigger: 'blur' }
  ],
  min_stock: [
    { required: true, message: '请输入最低库存', trigger: 'blur' },
    { type: 'number', min: 0, message: '最低库存不能小于0', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '描述不能超过500个字符', trigger: 'blur' }
  ]
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
    // 根据分类名称查找分类ID
    const categoryObj = productsStore.categories.find(cat => cat.name === selectedCategory.value)
    if (categoryObj) {
      products = products.filter(p => p.category_id === categoryObj.id)
    }
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
    // 创建完整的商品数据对象，只更新状态字段
    const updatedData = {
      barcode: product.barcode,
      name: product.name,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      min_stock: product.min_stock,
      description: product.description,
      category_id: product.category_id,
      is_active: product.is_active
    }
    await productsStore.updateProduct(product.id, updatedData)
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
  
  // 根据category_id查找分类名称
  const categoryObj = productsStore.categories.find(cat => cat.id === product.category_id)
  const categoryName = categoryObj ? categoryObj.name : ''
  
  Object.assign(productForm, {
    ...product,
    category: categoryName,  // 使用分类名称而不是category_id
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
    
    // 查找分类ID
    const selectedCategoryObj = productsStore.categories.find(cat => cat.name === productForm.category)
    if (!selectedCategoryObj) {
      ElMessage.error('请选择有效的商品分类')
      return
    }
    
    // 创建一个普通对象，避免Vue响应式代理对象导致的克隆问题
    const productData = {
      barcode: productForm.barcode,
      name: productForm.name,
      price: productForm.price,
      cost: productForm.cost,
      stock: productForm.stock,
      min_stock: productForm.min_stock,
      description: productForm.description,
      category_id: selectedCategoryObj.id,  // 使用category_id而不是category
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
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx,.xls'
  input.style.display = 'none'
  
  input.onchange = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    try {
      // 动态导入xlsx库
      const XLSX = await import('xlsx')
      
      // 读取文件
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // 获取第一个工作表
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // 转换为JSON数据
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          if (jsonData.length === 0) {
            ElMessage.warning('Excel文件中没有数据')
            return
          }
          
          // 验证和处理数据
          const validData = []
          const errors = []
          
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i]
            const rowNum = i + 2 // Excel行号（从第2行开始）
            
            try {
              // 验证必填字段
              if (!row['条码'] || !row['商品名称']) {
                errors.push(`第${rowNum}行：条码和商品名称为必填项`)
                continue
              }
              
              // 查找分类ID，不存在时设为null（未分类）
               let categoryId = null
               if (row['分类']) {
                 const category = productsStore.categories.find(cat => cat.name === row['分类'])
                 if (category) {
                   categoryId = category.id
                 }
                 // 如果分类不存在，categoryId保持为null，表示未分类
               }
              
              // 构建商品数据
              const productData = {
                barcode: String(row['条码'] || '').trim(),
                name: String(row['商品名称'] || '').trim(),
                category_id: categoryId,
                price: parseFloat(row['售价']) || 0,
                cost: parseFloat(row['成本']) || 0,
                stock: parseInt(row['库存']) || 0,
                min_stock: parseInt(row['最低库存']) || 0,
                description: String(row['描述'] || '').trim(),
                is_active: row['状态'] === '禁用' ? 0 : 1
              }
              
              // 验证数据有效性
              if (productData.price < 0) {
                errors.push(`第${rowNum}行：售价不能为负数`)
                continue
              }
              if (productData.cost < 0) {
                errors.push(`第${rowNum}行：成本不能为负数`)
                continue
              }
              if (productData.stock < 0) {
                errors.push(`第${rowNum}行：库存不能为负数`)
                continue
              }
              if (productData.min_stock < 0) {
                errors.push(`第${rowNum}行：最低库存不能为负数`)
                continue
              }
              
              validData.push(productData)
            } catch (error) {
              errors.push(`第${rowNum}行：数据格式错误 - ${error.message}`)
            }
          }
          
          // 显示验证结果
          if (errors.length > 0) {
            const errorMsg = errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n...还有${errors.length - 5}个错误` : '')
            await ElMessageBox.alert(errorMsg, '数据验证失败', {
              confirmButtonText: '确定',
              type: 'warning'
            })
            return
          }
          
          if (validData.length === 0) {
            ElMessage.warning('没有有效的数据可以导入')
            return
          }
          
          // 确认导入
          await ElMessageBox.confirm(
            `共找到 ${validData.length} 条有效数据，确定要导入吗？`,
            '确认导入',
            {
              confirmButtonText: '确定导入',
              cancelButtonText: '取消',
              type: 'info'
            }
          )
          
          // 批量导入数据
           let successCount = 0
           let failCount = 0
           let updateCount = 0
           
           for (const productData of validData) {
             try {
               // 检查条码是否已存在
               const existingProduct = productsStore.products.find(p => p.barcode === productData.barcode)
               
               if (existingProduct) {
                 // 更新现有商品
                 await productsStore.updateProduct(existingProduct.id, productData)
                 updateCount++
               } else {
                 // 添加新商品
                 await productsStore.addProduct(productData)
                 successCount++
               }
             } catch (error) {
               console.error('导入商品失败:', error)
               failCount++
             }
           }
          
          // 显示导入结果
           if (failCount === 0) {
             if (updateCount > 0) {
               ElMessage.success(`导入成功！新增 ${successCount} 个商品，更新 ${updateCount} 个商品`)
             } else {
               ElMessage.success(`导入成功！共新增 ${successCount} 个商品`)
             }
           } else {
             ElMessage.warning(`导入完成！新增 ${successCount} 个，更新 ${updateCount} 个，失败 ${failCount} 个`)
           }
          
        } catch (error) {
          console.error('解析Excel文件失败:', error)
          ElMessage.error('解析Excel文件失败，请检查文件格式')
        }
      }
      
      reader.readAsArrayBuffer(file)
      
    } catch (error) {
      console.error('导入失败:', error)
      ElMessage.error('导入失败：无法加载导入组件')
    }
  }
  
  // 触发文件选择
  document.body.appendChild(input)
  input.click()
  document.body.removeChild(input)
}

const handleExport = () => {
  try {
    // 动态导入xlsx库
    import('xlsx').then(XLSX => {
      // 准备导出数据
      const exportData = filteredProducts.value.map(product => ({
        '条码': product.barcode || '',
        '商品名称': product.name || '',
        '分类': getCategoryName(product.category_id),
        '售价': product.price ? Number(product.price).toFixed(2) : '0.00',
        '成本': product.cost ? Number(product.cost).toFixed(2) : '0.00',
        '库存': product.stock || 0,
        '最低库存': product.min_stock || 0,
        '状态': product.is_active === 1 ? '启用' : '禁用',
        '描述': product.description || ''
      }))
      
      // 创建工作簿
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)
      
      // 设置列宽
      const colWidths = [
        { wch: 15 }, // 条码
        { wch: 20 }, // 商品名称
        { wch: 12 }, // 分类
        { wch: 10 }, // 售价
        { wch: 10 }, // 成本
        { wch: 8 },  // 库存
        { wch: 10 }, // 最低库存
        { wch: 8 },  // 状态
        { wch: 30 }  // 描述
      ]
      ws['!cols'] = colWidths
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, '商品列表')
      
      // 生成文件名（包含当前日期时间）
      const now = new Date()
      const dateStr = now.getFullYear() + 
        String(now.getMonth() + 1).padStart(2, '0') + 
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') + 
        String(now.getMinutes()).padStart(2, '0')
      const fileName = `商品列表_${dateStr}.xlsx`
      
      // 导出文件
      XLSX.writeFile(wb, fileName)
      
      ElMessage.success(`导出成功！文件名：${fileName}`)
    }).catch(error => {
      console.error('导入xlsx库失败:', error)
      ElMessage.error('导出失败：无法加载导出组件')
    })
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 根据分类ID获取分类名称
const getCategoryName = (categoryId) => {
  const category = productsStore.categories.find(cat => cat.id === categoryId)
  return category ? category.name : '未分类'
}

// 分类管理相关方法
const getProductCountByCategory = (categoryName) => {
  // 根据分类名称查找分类ID
  const categoryObj = productsStore.categories.find(cat => cat.name === categoryName)
  if (!categoryObj) return 0
  return productsStore.products.filter(p => p.category_id === categoryObj.id).length
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
    
    // 创建一个普通对象，避免Vue响应式代理对象导致的克隆问题
    const categoryData = {
      name: categoryForm.name,
      description: categoryForm.description
    }
    
    if (editingCategory.value) {
      await productsStore.updateCategory(editingCategory.value.id, categoryData)
      ElMessage.success('分类更新成功')
    } else {
      await productsStore.addCategory(categoryData)
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

/* 搜索和筛选栏样式 */
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
  gap: 24px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-item {
  margin-left: auto;
}

.filter-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
  min-width: 70px;
}

.search-input {
  width: 280px;
}

.category-select {
  width: 160px;
}

.stock-select {
  width: 140px;
}

.primary-button {
  min-width: 100px;
}

.action-button {
  min-width: 80px;
}

/* 响应式设计 */
@media (max-width: 576px) {
  .search-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .search-section {
    flex-direction: column;
    gap: 12px;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
  
  .action-section {
    justify-content: center;
  }
  
  .secondary-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .search-content {
    gap: 16px;
  }
  
  .search-section {
    flex-wrap: wrap;
  }
  
  .search-input {
    width: 240px;
  }
  
  .filter-select {
    width: 120px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 992px) {
  .search-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-section {
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