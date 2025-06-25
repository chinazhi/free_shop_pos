import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useProductsStore = defineStore('products', () => {
  // 状态
  const products = ref([])
  const categories = ref([])
  const loading = ref(false)
  const searchKeyword = ref('')
  const selectedCategory = ref('')
  const initialized = ref(false) // 防止重复初始化
  let initializationPromise = null // 初始化Promise，防止并发初始化

  // 计算属性
  const filteredProducts = computed(() => {
    let filtered = products.value

    // 按关键词搜索
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(keyword) ||
        product.barcode?.includes(keyword)
      )
    }

    // 按分类筛选
    if (selectedCategory.value) {
      filtered = filtered.filter(product => product.category === selectedCategory.value)
    }

    return filtered
  })

  const lowStockProducts = computed(() => {
    return products.value.filter(product => 
      product.stock <= product.min_stock
    )
  })

  // 方法
  const loadProducts = async () => {
    // 如果正在初始化，等待初始化完成
    if (initializationPromise) {
      await initializationPromise
      // 重新从数据库加载商品
      const dbProducts = await window.ipcRenderer.invoke('get-products')
      products.value = dbProducts
      return
    }
    
    try {
      loading.value = true
      // 从数据库加载商品
      let dbProducts = await window.ipcRenderer.invoke('get-products')   
      products.value = dbProducts
      console.log('[loadProducts] products.value:', JSON.parse(JSON.stringify(products.value)))
    } catch (error) {
      console.error('加载商品失败:', error)
      // 如果初始化失败，重置Promise
      if (initializationPromise) {
        initializationPromise = null
        initialized.value = false
      }
    } finally {
      loading.value = false
    }
  }

  const loadCategories = async () => {
    try {
      const dbCategories = await window.ipcRenderer.invoke('get-categories')
      categories.value = dbCategories
    } catch (error) {
      console.error('加载分类失败:', error)
      // 如果数据库加载失败，使用默认分类
      categories.value = [
        { id: 1, name: '饮料', description: '各类饮品' },
        { id: 2, name: '零食', description: '休闲食品' },
        { id: 3, name: '日用品', description: '生活用品' },
        { id: 4, name: '烟酒', description: '烟草酒类' },
        { id: 5, name: '其他', description: '其他商品' }
      ]
    }
  }

  const addCategory = async (categoryData) => {
    try {
      const newCategory = await window.ipcRenderer.invoke('add-category', categoryData)
      categories.value.push(newCategory)
      return newCategory
    } catch (error) {
      console.error('添加分类失败:', error)
      throw error
    }
  }

  const updateCategory = async (id, categoryData) => {
    try {
      const updatedCategory = await window.ipcRenderer.invoke('update-category', id, categoryData)
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value[index] = updatedCategory
      }
      return updatedCategory
    } catch (error) {
      console.error('更新分类失败:', error)
      throw error
    }
  }

  const deleteCategory = async (id) => {
    try {
      await window.ipcRenderer.invoke('delete-category', id)
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value.splice(index, 1)
      }
      return true
    } catch (error) {
      console.error('删除分类失败:', error)
      throw error
    }
  }

  const checkBarcodeExists = (barcode, excludeId = null) => {
    return products.value.some(p => p.barcode === barcode && p.id !== excludeId)
  }

  const addProduct = async (productData) => {
    try {
      // 检查条码是否已存在
      if (productData.barcode && checkBarcodeExists(productData.barcode)) {
        throw new Error(`条码 "${productData.barcode}" 已存在，请使用其他条码`)
      }
      
      const newProduct = await window.ipcRenderer.invoke('add-product', productData)
      products.value.push(newProduct)
      return newProduct
    } catch (error) {
      console.error('添加商品失败:', error)
      throw error
    }
  }

  // 
  /**
   * 更新商品信息
   * @param {number} id - 商品ID
   * @param {object} productData - 商品数据对象
   * @property {string} productData.name - 商品名称
   * @property {string} productData.barcode - 商品条码
   * @property {number} productData.price - 商品价格
   * @property {number} productData.stock - 商品库存
   * @property {string} productData.category - 商品分类
   * @property {number} productData.min_stock - 最低库存
   * @returns {Promise<object>} 更新后的商品对象
   * @throws {Error} 当条码已存在或更新失败时抛出错误
   */
  const updateProduct = async (id, productData) => {
    try {
      // 检查条码是否已存在（排除当前商品）
      if (productData.barcode && checkBarcodeExists(productData.barcode, id)) {
        throw new Error(`条码 "${productData.barcode}" 已存在，请使用其他条码`)
      }
      
      // 调用主进程更新商品
      const updatedProduct = await window.ipcRenderer.invoke('update-product', id, productData)

      // 更新本地状态
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value[index] = updatedProduct
      }

      return updatedProduct
    } catch (error) {
      console.error('更新商品失败:', error)
      throw error
    }
  }

  const deleteProduct = async (id) => {
    try {
      await window.ipcRenderer.invoke('delete-product', id)
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value.splice(index, 1)
      }
      return true
    } catch (error) {
      console.error('删除商品失败:', error)
      throw error
    }
  }

  const getProductByBarcode = (barcode) => {
    return products.value.find(p => p.barcode === barcode)
  }

  const getProductById = (id) => {
    return products.value.find(p => p.id === id)
  }

  const updateStock = async (productId, quantity, type = 'adjust', reason = '', operator = '系统') => {
    try {
      // 参数校验
      const validTypes = ['in', 'out', 'adjust']
      if (!validTypes.includes(type)) {
        throw new Error('无效的库存操作类型')
      }
      if (typeof quantity !== 'number' || isNaN(quantity) || quantity < 0) {
        throw new Error('库存变动数量必须为非负数字')
      }
      if (type !== 'adjust' && quantity === 0) {
        throw new Error('入库/出库数量不能为0')
      }
      const product = getProductById(productId)
      if (!product) {
        throw new Error('商品不存在')
      }

      const oldStock = product.stock
      let newStock
      switch (type) {
        case 'in':
          newStock = oldStock + quantity
          break
        case 'out':
          newStock = oldStock - quantity
          break
        case 'adjust':
          newStock = quantity
          break
        default:
          throw new Error('无效的库存操作类型')
      }

      if (newStock < 0) {
        throw new Error('库存不足')
      }

      // 使用事务性库存更新
      const updatedProduct = await window.ipcRenderer.invoke('update-stock-with-log', productId, {
        stock: newStock
      }, {
        product_id: productId,
        type: type,
        quantity: type === 'adjust' ? quantity - oldStock : quantity,
        before_stock: oldStock,
        after_stock: newStock,
        reason: reason,
        operator: operator
      })

      // 更新本地数据
      const index = products.value.findIndex(p => p.id === productId)
      if (index !== -1) {
        products.value[index] = updatedProduct
      }

      console.log(`库存变动: ${product.name} ${oldStock} -> ${newStock}`)

      return updatedProduct
    } catch (error) {
      console.error('更新库存失败:', error)
      throw error
    }
  }

  // 获取库存变动记录
  const getInventoryLogs = async (filters = {}) => {
    try {
      const logs = await window.ipcRenderer.invoke('get-inventory-logs', filters)
      return logs
    } catch (error) {
      console.error('获取库存记录失败:', error)
      throw error
    }
  }

  const setSearchKeyword = (keyword) => {
    searchKeyword.value = keyword
  }

  const setSelectedCategory = (category) => {
    selectedCategory.value = category
  }

  return {
    products,
    categories,
    loading,
    searchKeyword,
    selectedCategory,
    initialized,
    filteredProducts,
    lowStockProducts,
    loadProducts,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductByBarcode,
    getProductById,
    updateStock,
    getInventoryLogs,
    setSearchKeyword,
    setSelectedCategory
  }
})