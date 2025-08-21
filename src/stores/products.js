import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dbManager from '../utils/indexedDB.js'

export const useProductsStore = defineStore('products', () => {
  // 状态
  const products = ref([])
  const categories = ref([])
  const loading = ref(false)
  const searchKeyword = ref('')
  const selectedCategory = ref('')
  const initialized = ref(false)
  let initializationPromise = null

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
      // 根据分类名称查找分类ID
      const categoryObj = categories.value.find(cat => cat.name === selectedCategory.value)
      if (categoryObj) {
        filtered = filtered.filter(product => product.category_id === categoryObj.id)
      }
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
    if (initializationPromise) {
      await initializationPromise
      const dbProducts = await dbManager.getAll('products')
      products.value = dbProducts
      return
    }
    
    try {
      loading.value = true
      const dbProducts = await dbManager.getAll('products')
      products.value = dbProducts
      console.log('[loadProducts] products.value:', JSON.parse(JSON.stringify(products.value)))
    } catch (error) {
      console.error('加载商品失败:', error)
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
      const dbCategories = await dbManager.getAll('categories')
      categories.value = dbCategories
    } catch (error) {
      console.error('加载分类失败:', error)
      categories.value = [
        { id: 1, name: '饮料' },
        { id: 2, name: '零食' },
        { id: 3, name: '日用品' },
        { id: 4, name: '其他' }
      ]
    }
  }

  const addCategory = async (categoryData) => {
    try {
      const id = await dbManager.add('categories', categoryData)
      const newCategory = { ...categoryData, id }
      categories.value.push(newCategory)
      return newCategory
    } catch (error) {
      console.error('添加分类失败:', error)
      throw error
    }
  }

  const updateCategory = async (id, categoryData) => {
    try {
      const updatedCategory = { ...categoryData, id }
      await dbManager.update('categories', updatedCategory)
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
      await dbManager.delete('categories', id)
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
      const id = await dbManager.add('products', productData)
      const newProduct = { ...productData, id }
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
      
      const updatedProduct = { ...productData, id }
      await dbManager.update('products', updatedProduct)

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
      await dbManager.delete('products', id)
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

  const updateStock = async (productId, quantity, type = 'adjust') => {
    try {
      const validTypes = ['in', 'out', 'adjust']
      if (!validTypes.includes(type)) {
        throw new Error('无效的库存操作类型')
      }
      if (typeof quantity !== 'number' || isNaN(quantity) || quantity < 0) {
        throw new Error('库存变动数量必须为非负数字')
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
      }

      if (newStock < 0) {
        throw new Error('库存不足')
      }

      // 更新商品库存
      const updatedProduct = { ...product, stock: newStock }
      await dbManager.update('products', updatedProduct)

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
    setSearchKeyword,
    setSelectedCategory
  }
})