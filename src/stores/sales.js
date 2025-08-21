import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dbManager from '../utils/indexedDB.js'
import dayjs from 'dayjs'

export const useSalesStore = defineStore('sales', () => {
  // 状态
  const sales = ref([])
  const loading = ref(false)
  const dateRange = ref([dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')])

  // 计算属性
  const filteredSales = computed(() => {
    if (!dateRange.value || dateRange.value.length !== 2) {
      return sales.value
    }
    
    const [startDate, endDate] = dateRange.value
    return sales.value.filter(sale => {
      const saleDate = dayjs(sale.sale_date).format('YYYY-MM-DD')
      return saleDate >= startDate && saleDate <= endDate
    })
  })

  const totalSales = computed(() => {
    return filteredSales.value.reduce((sum, sale) => sum + (sale.final_amount || 0), 0)
  })

  const totalOrders = computed(() => {
    return filteredSales.value.length
  })

  const averageOrderValue = computed(() => {
    return totalOrders.value > 0 ? totalSales.value / totalOrders.value : 0
  })

  // 方法
  const loadSales = async () => {
    try {
      loading.value = true
      const dbSales = await dbManager.getAll('sales')
      // 按时间倒序排列
      sales.value = dbSales.sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
    } catch (error) {
      console.error('加载销售记录失败:', error)
    } finally {
      loading.value = false
    }
  }

  const getSaleById = async (id) => {
    try {
      const sale = await dbManager.getById('sales', id)
      if (sale) {
        // 获取销售明细
        const items = await dbManager.getAllByIndex('sale_items', 'sale_id', id)
        sale.items = items
      }
      return sale
    } catch (error) {
      console.error('获取销售记录失败:', error)
      return null
    }
  }

  const deleteSale = async (id) => {
    try {
      // 删除销售记录
      await dbManager.delete('sales', id)
      // 删除相关的销售明细
      const items = await dbManager.getAllByIndex('sale_items', 'sale_id', id)
      for (const item of items) {
        await dbManager.delete('sale_items', item.id)
      }
      // 更新本地数据
      const index = sales.value.findIndex(s => s.id === id)
      if (index !== -1) {
        sales.value.splice(index, 1)
      }
      return true
    } catch (error) {
      console.error('删除销售记录失败:', error)
      throw error
    }
  }

  const setDateRange = (range) => {
    dateRange.value = range
  }

  // 获取今日销售统计
  const getTodayStats = () => {
    const today = dayjs().format('YYYY-MM-DD')
    const todaySales = sales.value.filter(sale => {
      return dayjs(sale.sale_date).format('YYYY-MM-DD') === today
    })
    
    return {
      totalAmount: todaySales.reduce((sum, sale) => sum + (sale.final_amount || 0), 0),
      totalOrders: todaySales.length,
      averageAmount: todaySales.length > 0 ? 
        todaySales.reduce((sum, sale) => sum + (sale.final_amount || 0), 0) / todaySales.length : 0
    }
  }

  return {
    sales,
    loading,
    dateRange,
    filteredSales,
    totalSales,
    totalOrders,
    averageOrderValue,
    loadSales,
    getSaleById,
    deleteSale,
    setDateRange,
    getTodayStats
  }
})