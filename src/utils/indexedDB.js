// IndexedDB 数据库管理
class IndexedDBManager {
  constructor() {
    this.dbName = 'FreeShopPOS'
    this.version = 1
    this.db = null
  }

  // 初始化数据库
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(new Error('数据库打开失败'))
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // 创建商品表
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true })
          productStore.createIndex('barcode', 'barcode', { unique: true })
          productStore.createIndex('name', 'name', { unique: false })
          productStore.createIndex('category_id', 'category_id', { unique: false })
        }

        // 创建分类表
        if (!db.objectStoreNames.contains('categories')) {
          const categoryStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true })
          categoryStore.createIndex('name', 'name', { unique: true })
        }

        // 创建销售记录表
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true })
          salesStore.createIndex('sale_date', 'sale_date', { unique: false })
        }

        // 创建销售商品明细表
        if (!db.objectStoreNames.contains('sale_items')) {
          const saleItemsStore = db.createObjectStore('sale_items', { keyPath: 'id', autoIncrement: true })
          saleItemsStore.createIndex('sale_id', 'sale_id', { unique: false })
          saleItemsStore.createIndex('product_id', 'product_id', { unique: false })
        }

        // 创建系统设置表
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'key' })
        }
      }
      
      request.onsuccess = (event) => {
        this.db = event.target.result
        // 在数据库打开成功后初始化默认数据
        this.initDefaultData().then(() => {
          resolve(this.db)
        }).catch(reject)
      }
    })
  }

  // 初始化默认数据
  async initDefaultData() {
    const transaction = this.db.transaction(['categories', 'products', 'settings'], 'readwrite')
    
    // 默认分类
    const categoryStore = transaction.objectStore('categories')
    const defaultCategories = [
      { name: '饮料' },
      { name: '零食' },
      { name: '日用品' },
      { name: '其他' }
    ]
    
    defaultCategories.forEach(category => {
      categoryStore.add(category)
    })

    // 默认商品
    const productStore = transaction.objectStore('products')
    const defaultProducts = [
      {
        name: '可口可乐',
        barcode: '6901668001016',
        price: 3.50,
        cost: 2.00,
        stock: 50,
        min_stock: 10,
        category_id: 1,
        is_active: 1
      },
      {
        name: '薯片',
        barcode: '6901668001023',
        price: 5.00,
        cost: 3.00,
        stock: 30,
        min_stock: 5,
        category_id: 2,
        is_active: 1
      }
    ]
    
    defaultProducts.forEach(product => {
      productStore.add(product)
    })

    // 默认设置
    const settingsStore = transaction.objectStore('settings')
    const defaultSettings = [
      { key: 'shop_name', value: '糖果便利店' },
      { key: 'shop_address', value: '地址' },
      { key: 'shop_phone', value: '电话' },
      { key: 'currency', value: 'CNY' },
      { key: 'decimalPlaces', value: 2 },
      { key: 'enableTax', value: false },
      { key: 'tax_rate', value: '0' },
      { key: 'themeColor', value: '#ffffff' },
      { key: 'fontSize', value: 'md' },
      { key: 'language', value: 'zh-CN' },
      { key: 'timeFormat', value: '24' }
    ]
    
    defaultSettings.forEach(setting => {
      settingsStore.add(setting)
    })
  }

  // 通用查询方法
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(new Error(`查询${storeName}失败`))
      }
    })
  }

  // 通用添加方法
  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.add(data)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(new Error(`添加到${storeName}失败`))
      }
    })
  }

  // 通用更新方法
  async update(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(new Error(`更新${storeName}失败`))
      }
    })
  }

  // 通用删除方法
  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve(true)
      }

      request.onerror = () => {
        reject(new Error(`删除${storeName}记录失败`))
      }
    })
  }

  // 根据ID获取单条记录
  async getById(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(new Error(`获取${storeName}记录失败`))
      }
    })
  }

  // 根据索引查询
  async getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.get(value)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(new Error(`根据索引查询${storeName}失败`))
      }
    })
  }

  // 根据索引获取所有匹配记录
  async getAllByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.getAll(value)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(new Error(`根据索引查询${storeName}失败`))
      }
    })
  }
}

// 创建全局实例
const dbManager = new IndexedDBManager()

export default dbManager