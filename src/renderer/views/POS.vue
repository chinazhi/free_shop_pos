<template>
  <div class="pos-container">
    <!-- 左侧区域 -->
    <div class="pos-left">
      <!-- 搜索栏 -->
      <div class="search-section card">
        <el-input
          v-model="searchKeyword"
          placeholder="扫描条码或输入商品名称"
          size="large"
          clearable
          @keyup.enter="handleSearch"
          @clear="searchKeyword = ''"
        >
          <template #prepend>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <!-- 商品分类 -->
      <div class="category-section card">
        <div class="card-header">
          <span class="card-title">商品分类</span>
        </div>
        <div class="category-tabs">
          <el-button
            :type="selectedCategory === '' ? 'primary' : 'default'"
            size="small"
            @click="setCategory('')"
          >
            全部
          </el-button>
          <el-button
            v-for="category in productsStore.categories"
            :key="category.id"
            :type="selectedCategory === category.name ? 'primary' : 'default'"
            size="small"
            @click="setCategory(category.name)"
          >
            {{ category.name }}
          </el-button>
        </div>
      </div>

      <!-- 商品列表 -->
      <div class="products-section card">
        <div class="card-header">
          <span class="card-title">商品列表</span>
          <span class="product-count">共 {{ filteredProducts.length }} 件商品</span>
        </div>
        <div class="product-grid">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="product-item"
            @click="addToCart(product)"
          >
            <div class="product-image">
              <el-icon size="40"><Box /></el-icon>
            </div>
            <div class="product-info">
              <div class="product-name">{{ product.name }}</div>
              <div class="product-price">¥{{ product.price.toFixed(2) }}</div>
              <div class="product-stock">库存: {{ product.stock }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧购物车 -->
    <div class="pos-right">
      <!-- 购物车 -->
      <div class="cart-container">
        <div class="cart-header">
          <span>购物车 ({{ cartStore.itemCount }})</span>
          <el-button
            v-if="cartStore.items.length > 0"
            type="danger"
            size="small"
            @click="clearCart"
          >
            清空
          </el-button>
        </div>

        <div class="cart-items">
          <div
            v-for="item in cartStore.items"
            :key="item.product_id"
            class="cart-item"
          >
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-price">¥{{ item.unit_price.toFixed(2) }}</div>
            </div>
            <div class="item-controls">
              <el-input-number
                v-model="item.quantity"
                :min="1"
                :max="getProductStock(item.product_id)"
                size="small"
                @change="updateQuantity(item.product_id, $event)"
              />
            </div>
            <div class="item-total">
              ¥{{ item.total_price.toFixed(2) }}
            </div>
            <div class="item-actions">
              <el-button
                type="danger"
                size="small"
                circle
                @click="removeFromCart(item.product_id)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 会员信息 -->
        <div class="member-section">
          <el-input
            v-model="memberPhone"
            placeholder="输入会员手机号"
            clearable
            @keyup.enter="searchMember"
          >
            <template #prepend>
              <el-icon><User /></el-icon>
            </template>
            <template #append>
              <el-button @click="searchMember">查找</el-button>
            </template>
          </el-input>
          <div v-if="cartStore.currentMember" class="member-info">
            <p><strong>{{ cartStore.currentMember.name }}</strong></p>
            <p>积分: {{ cartStore.currentMember.points }}</p>
            <p>等级: {{ cartStore.currentMember.level }}</p>
          </div>
        </div>

        <!-- 优惠设置 -->
        <div class="discount-section">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-input
                v-model.number="customDiscount"
                placeholder="折扣%"
                type="number"
                :min="0"
                :max="100"
                @change="setDiscount"
              >
                <template #append>%</template>
              </el-input>
            </el-col>
            <el-col :span="12">
              <el-select v-model="cartStore.paymentMethod" placeholder="支付方式">
                <el-option label="现金" value="cash" />
                <el-option label="微信" value="wechat" />
                <el-option label="支付宝" value="alipay" />
                <el-option label="银行卡" value="card" />
              </el-select>
            </el-col>
          </el-row>
        </div>

        <!-- 金额汇总 -->
        <div class="amount-summary">
          <div class="amount-row">
            <span>小计:</span>
            <span>¥{{ cartStore.subtotal.toFixed(2) }}</span>
          </div>
          <div class="amount-row" v-if="cartStore.discountAmount > 0">
            <span>优惠:</span>
            <span class="discount">-¥{{ cartStore.discountAmount.toFixed(2) }}</span>
          </div>
          <div class="amount-row total">
            <span>合计:</span>
            <span>¥{{ cartStore.totalAmount.toFixed(2) }}</span>
          </div>
        </div>

        <!-- 收款区域 -->
        <div class="payment-section" v-if="cartStore.paymentMethod === 'cash'">
          <el-input
            v-model.number="cartStore.receivedAmount"
            placeholder="收款金额"
            size="large"
            type="number"
            :min="0"
          >
            <template #prepend>收款</template>
            <template #append>元</template>
          </el-input>
          <div v-if="cartStore.receivedAmount >= cartStore.totalAmount" class="change-amount">
            找零: ¥{{ cartStore.changeAmount.toFixed(2) }}
          </div>
        </div>

        <!-- 结账按钮 -->
        <div class="checkout-section">
          <el-button
            type="primary"
            size="large"
            :disabled="!canCheckout"
            @click="handleCheckout"
            style="width: 100%"
          >
            结账 ({{ cartStore.itemCount }}件)
          </el-button>
        </div>
      </div>
    </div>

    <!-- 结账成功对话框 -->
    <el-dialog
      v-model="showReceiptDialog"
      title="结账成功"
      width="400px"
      center
      :close-on-click-modal="false"
    >
      <div class="receipt-content">
        <h3>{{ appStore.settings.shopName }}</h3>
        <p>订单号: {{ lastOrderNo }}</p>
        <p>时间: {{ new Date().toLocaleString() }}</p>
        <hr>
        <div v-for="item in lastOrderItems" :key="item.product_id" class="receipt-item">
          <span>{{ item.name }}</span>
          <span>{{ item.quantity }}x{{ item.unit_price.toFixed(2) }}</span>
          <span>¥{{ item.total_price.toFixed(2) }}</span>
        </div>
        <hr>
        <div class="receipt-total">
          <p>小计: ¥{{ lastOrderSubtotal.toFixed(2) }}</p>
          <p v-if="lastOrderDiscount > 0">优惠: -¥{{ lastOrderDiscount.toFixed(2) }}</p>
          <p><strong>合计: ¥{{ lastOrderTotal.toFixed(2) }}</strong></p>
          <p v-if="lastPaymentMethod === 'cash'">收款: ¥{{ lastReceivedAmount.toFixed(2) }}</p>
          <p v-if="lastPaymentMethod === 'cash'">找零: ¥{{ lastChangeAmount.toFixed(2) }}</p>
        </div>
        <hr>
        <p class="receipt-footer">{{ appStore.settings.receiptFooter }}</p>
      </div>
      <template #footer>
        <el-button @click="printReceipt">打印小票</el-button>
        <el-button type="primary" @click="showReceiptDialog = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProductsStore } from '../stores/products'
import { useCartStore } from '../stores/cart'
import { useAppStore } from '../stores/app'

const productsStore = useProductsStore()
const cartStore = useCartStore()
const appStore = useAppStore()

// 响应式数据
const searchKeyword = ref('')
const selectedCategory = ref('')
const memberPhone = ref('')
const customDiscount = ref(0)
const showReceiptDialog = ref(false)
const lastOrderNo = ref('')
const lastOrderItems = ref([])
const lastOrderSubtotal = ref(0)
const lastOrderDiscount = ref(0)
const lastOrderTotal = ref(0)
const lastPaymentMethod = ref('')
const lastReceivedAmount = ref(0)
const lastChangeAmount = ref(0)

// 计算属性
const filteredProducts = computed(() => {
  // 过滤出有效的且有库存的商品
  let products = productsStore.products.filter(p => p.is_active && p.stock > 0)
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    products = products.filter(p => 
      p.name.toLowerCase().includes(keyword) ||
      p.barcode?.includes(keyword)
    )
  }
  
  if (selectedCategory.value) {
    products = products.filter(p => p.category === selectedCategory.value)
  }
  
  return products
})

const canCheckout = computed(() => {
  if (cartStore.items.length === 0) return false
  if (cartStore.paymentMethod === 'cash') {
    return cartStore.receivedAmount >= cartStore.totalAmount
  }
  return true
})

// 监听搜索关键词变化
watch(searchKeyword, (newVal) => {
  productsStore.setSearchKeyword(newVal)
})

// 方法
const setCategory = (category) => {
  selectedCategory.value = category
  productsStore.setSelectedCategory(category)
}

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) return
  
  // 如果是条码格式，直接添加到购物车
  if (/^\d{8,}$/.test(searchKeyword.value)) {
    try {
      await cartStore.addProductByBarcode(searchKeyword.value)
      searchKeyword.value = ''
      ElMessage.success('商品已添加到购物车')
    } catch (error) {
      ElMessage.error(error.message)
    }
  }
}

const addToCart = (product) => {
  try {
    cartStore.addItem(product, 1)
    ElMessage.success(`${product.name} 已添加到购物车`)
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const removeFromCart = (productId) => {
  cartStore.removeItem(productId)
}

const updateQuantity = (productId, quantity) => {
  cartStore.updateItemQuantity(productId, quantity)
}

const clearCart = async () => {
  try {
    await ElMessageBox.confirm('确定要清空购物车吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    cartStore.clearCart()
    ElMessage.success('购物车已清空')
  } catch {
    // 用户取消
  }
}

const getProductStock = (productId) => {
  const product = productsStore.getProductById(productId)
  return product?.stock || 0
}

const searchMember = () => {
  if (!memberPhone.value.trim()) {
    cartStore.setMember(null)
    return
  }
  
  // 这里后续会从数据库查找会员
  // 暂时使用模拟数据
  const mockMember = {
    id: 1,
    name: '张三',
    phone: memberPhone.value,
    points: 1200,
    level: 'gold'
  }
  
  cartStore.setMember(mockMember)
  ElMessage.success('会员信息已加载')
}

const setDiscount = () => {
  cartStore.setDiscount(customDiscount.value || 0)
}

const handleCheckout = async () => {
  try {
    const result = await cartStore.checkout()
    
    // 保存订单信息用于显示小票
    lastOrderNo.value = result.orderNo
    lastOrderItems.value = [...cartStore.items]
    lastOrderSubtotal.value = cartStore.subtotal
    lastOrderDiscount.value = cartStore.discountAmount
    lastOrderTotal.value = cartStore.totalAmount
    lastPaymentMethod.value = cartStore.paymentMethod
    lastReceivedAmount.value = cartStore.receivedAmount
    lastChangeAmount.value = cartStore.changeAmount
    
    showReceiptDialog.value = true
    
    // 重置表单
    memberPhone.value = ''
    customDiscount.value = 0
    
    ElMessage.success('结账成功！')
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const printReceipt = () => {
  // 这里后续会实现打印功能
  ElMessage.info('打印功能开发中...')
}
</script>

<style scoped>
.pos-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
  height: calc(100vh - 100px);
  padding: 20px;
}

.pos-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: hidden;
}

.pos-right {
  display: flex;
  flex-direction: column;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.product-count {
  font-size: 14px;
  color: #666;
}

.category-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.products-section {
  flex: 1;
  overflow: hidden;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.product-item {
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.product-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  transform: translateY(-2px);
}

.product-image {
  margin-bottom: 10px;
  color: #409eff;
}

.product-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price {
  font-size: 16px;
  font-weight: 600;
  color: #e74c3c;
  margin-bottom: 5px;
}

.product-stock {
  font-size: 12px;
  color: #666;
}

.cart-container {
  background: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.cart-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}

.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  max-height: 300px;
}

.cart-item {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #f5f5f5;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-info {
  min-width: 0;
}

.item-name {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  font-size: 12px;
  color: #666;
}

.item-total {
  font-size: 14px;
  font-weight: 600;
  color: #e74c3c;
  text-align: right;
}

.member-section,
.discount-section {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.member-info {
  margin-top: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.member-info p {
  margin: 5px 0;
  font-size: 14px;
}

.amount-summary {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.amount-row.total {
  font-size: 18px;
  font-weight: 600;
  color: #e74c3c;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
  margin-top: 8px;
}

.discount {
  color: #67c23a;
}

.payment-section {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.change-amount {
  margin-top: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #67c23a;
  text-align: center;
}

.checkout-section {
  padding: 20px;
}

.receipt-content {
  text-align: center;
  font-family: monospace;
}

.receipt-content h3 {
  margin-bottom: 10px;
  color: #333;
}

.receipt-item {
  display: flex;
  justify-content: space-between;
  margin: 5px 0;
  font-size: 14px;
}

.receipt-total {
  margin: 10px 0;
}

.receipt-footer {
  margin-top: 10px;
  font-style: italic;
  color: #666;
}

@media (max-width: 1200px) {
  .pos-container {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }
  
  .cart-container {
    max-height: 400px;
  }
}
</style>