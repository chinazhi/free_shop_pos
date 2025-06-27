import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useProductsStore } from './products'

export const useCartStore = defineStore('cart', () => {
  // 状态
  const items = ref([])
  const currentMember = ref(null)
  const discount = ref(0)
  const paymentMethod = ref('cash')
  const receivedAmount = ref(0)

  // 计算属性
  const subtotal = computed(() => {
    return items.value.reduce((sum, item) => sum + item.total_price, 0)
  })

  const discountAmount = computed(() => {
    return subtotal.value * (discount.value / 100)
  })

  const taxAmount = computed(() => {
    // 这里可以根据设置计算税额
    return 0
  })

  const totalAmount = computed(() => {
    return subtotal.value - discountAmount.value + taxAmount.value
  })

  const changeAmount = computed(() => {
    return Math.max(0, receivedAmount.value - totalAmount.value)
  })

  const itemCount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  // 方法
  // 工具函数：安全转换为数字
  const toNumber = (val, def = 0) => {
    const n = Number(val)
    return isNaN(n) ? def : n
  }

  // 优化后的 addItem，支持商品级折扣
  const addItem = (product, quantity = 1, itemDiscount = 0) => {
    const productsStore = useProductsStore()
    const existingItem = items.value.find(item => item.product_id === product.id)
    const unitPrice = toNumber(product.price)
    const qty = toNumber(quantity, 1)
    const discountVal = toNumber(itemDiscount)
    // 新增：加入购物车前校验库存
    const productInStore = productsStore.getProductById(product.id)
    const cartQty = existingItem ? toNumber(existingItem.quantity) : 0
    if (!productInStore || toNumber(productInStore.stock) < cartQty + qty) {
      throw new Error('商品库存不足')
    }
    if (existingItem) {
      // 如果商品已存在，增加数量
      updateItemQuantity(existingItem.product_id, existingItem.quantity + qty)
    } else {
      // 添加新商品
      const newItem = {
        product_id: product.id,
        barcode: product.barcode,
        name: product.name,
        unit_price: unitPrice,
        quantity: qty,
        discount: discountVal,
        total_price: Math.max(0, unitPrice * qty - discountVal)
      }
      items.value.push(newItem)
    }
  }

  const removeItem = (productId) => {
    const index = items.value.findIndex(item => item.product_id === productId)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  }

  const updateItemQuantity = (productId, quantity) => {
    const item = items.value.find(item => item.product_id === productId)
    const qty = toNumber(quantity, 1)
    if (item) {
      if (qty <= 0) {
        removeItem(productId)
      } else {
        item.quantity = qty
        item.total_price = Math.max(0, toNumber(item.unit_price) * qty - toNumber(item.discount))
      }
    }
  }

  const updateItemDiscount = (productId, discountAmount) => {
    const item = items.value.find(item => item.product_id === productId)
    const discountVal = toNumber(discountAmount)
    if (item) {
      item.discount = discountVal
      item.total_price = Math.max(0, toNumber(item.unit_price) * toNumber(item.quantity) - discountVal)
    }
  }

  const clearCart = () => {
    items.value = []
    currentMember.value = null
    discount.value = 0
    receivedAmount.value = 0
    paymentMethod.value = 'cash'
  }

  const setMember = (member) => {
    currentMember.value = member
    // 可以根据会员等级设置折扣
    if (member) {
      switch (member.level) {
        case 'gold':
          discount.value = 10
          break
        case 'silver':
          discount.value = 5
          break
        case 'bronze':
          discount.value = 2
          break
        default:
          discount.value = 0
      }
    } else {
      discount.value = 0
    }
  }

  const setDiscount = (discountPercent) => {
    discount.value = discountPercent
  }

  const setPaymentMethod = (method) => {
    paymentMethod.value = method
  }

  const setReceivedAmount = (amount) => {
    receivedAmount.value = amount
  }

  // 校验购物车内总数量
  const addProductByBarcode = async (barcode) => {
    const productsStore = useProductsStore()
    const product = productsStore.getProductByBarcode(barcode)
    if (!product) {
      throw new Error('商品不存在或已下架')
    }
    const cartItem = items.value.find(item => item.product_id === product.id)
    const cartQty = cartItem ? toNumber(cartItem.quantity) : 0
    if (toNumber(product.stock) < cartQty + 1) {
      throw new Error('商品库存不足')
    }
    addItem(product, 1)
    return product
  }

  const validateCart = () => {
    const errors = []
    if (!Array.isArray(items.value) || items.value.length === 0) {
      errors.push('购物车为空')
    }
    
    // 检查库存
    const productsStore = useProductsStore()
    for (const item of items.value) {
      const product = productsStore.getProductById(item.product_id)
      if (!product) {
        errors.push(`商品 ${item.name} 不存在`)
        continue
      }
      if (toNumber(product.stock) < toNumber(item.quantity)) {
        errors.push(`商品 ${item.name} 库存不足，当前库存：${product.stock}`)
      }
    }
    if (paymentMethod.value === 'cash' && toNumber(receivedAmount.value) < toNumber(totalAmount.value)) {
      errors.push('收款金额不足')
    }
    
    return errors
  }

  // 优化后的 checkout，异常处理和依赖注入优化
  const checkout = async () => {
    const productsStore = useProductsStore()
    const errors = validateCart()
    if (errors.length > 0) {
      throw new Error(errors.join('\n'))
    }
    
    try {
      // 生成订单号
      const orderNo = generateOrderNo()
      
      // 构建销售记录
      const saleData = {
        order_no: orderNo,
        member_id: currentMember.value?.id || null,
        total_amount: subtotal.value,
        discount_amount: discountAmount.value,
        tax_amount: taxAmount.value,
        final_amount: totalAmount.value,
        payment_method: paymentMethod.value,
        payment_status: 'completed',
        cashier: 'current_user'
      }
      // 校验库存
      const stockUpdates = []
      const logs = []
      const itemsArr = []
      for (const item of items.value) {
        const product = productsStore.getProductById(item.product_id)
        if (!product || toNumber(product.stock) < toNumber(item.quantity)) {
          throw new Error(`商品 ${item.name} 库存不足，当前库存：${product ? product.stock : 0}`)
        }
        // 计算新库存
        const newStock = toNumber(product.stock) - toNumber(item.quantity)
        stockUpdates.push({ product_id: item.product_id, new_stock: newStock })
        logs.push({
          product_id: item.product_id,
          type: 'out',
          quantity: toNumber(item.quantity),
          before_stock: toNumber(product.stock),
          after_stock: newStock,
          reason: '销售出库',
          operator: 'current_user'
        })
        itemsArr.push({
          product_id: item.product_id,
          quantity: toNumber(item.quantity),
          unit_price: toNumber(item.unit_price),
          total_price: toNumber(item.total_price),
          discount: toNumber(item.discount)
        })
      }
      let memberPoints = null
      if (currentMember.value && currentMember.value.id) {
        // 假设每消费1元积1分，可根据实际规则调整
        const beforePoints = toNumber(currentMember.value.points)
        const changeAmount = Math.floor(totalAmount.value)
        const afterPoints = beforePoints + changeAmount
        memberPoints = {
          type: 'sale',
          change_amount: changeAmount,
          before_points: beforePoints,
          after_points: afterPoints,
          reason: '消费积分',
          operator: 'current_user'
        }
      }
      const result = await window.ipcRenderer.invoke('process-sale', {
        sale: saleData,
        items: itemsArr,
        stockUpdates,
        logs,
        memberPoints
      })
      if (!result.success) throw new Error(result.error || '结账失败')
      await window.ipcRenderer.invoke('print-receipt', { orderNo, saleData })
      
      // 保存订单信息用于返回
      const orderInfo = {
        success: true,
        orderNo,
        saleData,
        items: [...items.value],
        subtotal: subtotal.value,
        discountAmount: discountAmount.value,
        totalAmount: totalAmount.value,
        paymentMethod: paymentMethod.value,
        receivedAmount: receivedAmount.value,
        changeAmount: changeAmount.value
      }
      
      // 清空购物车
      clearCart()
      
      return orderInfo
    } catch (error) {
      // 统一异常处理
      console.error('结账失败:', error)
      throw new Error(error.message || '结账失败')
    }
  }

  const generateOrderNo = () => {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    const hour = now.getHours().toString().padStart(2, '0')
    const minute = now.getMinutes().toString().padStart(2, '0')
    const second = now.getSeconds().toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    return `${year}${month}${day}${hour}${minute}${second}${random}`
  }

  return {
    items,
    currentMember,
    discount,
    paymentMethod,
    receivedAmount,
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount,
    changeAmount,
    itemCount,
    addItem,
    removeItem,
    updateItemQuantity,
    updateItemDiscount,
    clearCart,
    setMember,
    setDiscount,
    setPaymentMethod,
    setReceivedAmount,
    addProductByBarcode,
    validateCart,
    checkout
  }
})