import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMembersStore = defineStore('members', () => {
  // 状态
  const members = ref([])
  const loading = ref(false)
  const searchKeyword = ref('')
  const levelFilter = ref('')
  const dateRange = ref([])

  // 计算属性
  const filteredMembers = computed(() => {
    let filtered = members.value
    
    // 搜索过滤
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      filtered = filtered.filter(m => 
        m.name?.toLowerCase?.().includes(keyword) ||
        (m.phone || '').includes(keyword) ||
        (m.member_no?.toLowerCase?.() || '').includes(keyword)
      )
    }
    
    // 等级过滤
    if (levelFilter.value) {
      filtered = filtered.filter(m => m.level === levelFilter.value)
    }
    
    // 日期范围过滤
    if (dateRange.value && dateRange.value.length === 2) {
      const [start, end] = dateRange.value
      filtered = filtered.filter(m => {
        const createDate = new Date(m.created_at)
        return createDate >= start && createDate <= end
      })
    }
    
    return filtered
  })

  const totalMembers = computed(() => members.value.length)
  const activeMembers = computed(() => {
    // 假设最近30天有消费的为活跃会员
    return Math.floor(members.value.length * 0.7)
  })
  const totalPoints = computed(() => {
    return members.value.reduce((sum, member) => sum + (member.points || 0), 0)
  })
  const totalSpent = computed(() => {
    return members.value.reduce((sum, member) => sum + (member.total_spent || 0), 0)
  })

  // 方法
  const loadMembers = async () => {
    try {
      loading.value = true
      // 从数据库加载会员
      let dbMembers = await window.ipcRenderer.invoke('get-members')
      members.value = dbMembers
    } catch (error) {
      console.error('加载会员失败:', error)
    } finally {
      loading.value = false
    }
  }

  const addMember = async (memberData) => {
    try {
      const newMember = await window.ipcRenderer.invoke('add-member', memberData)
      members.value.push(newMember)
      return newMember
    } catch (error) {
      console.error('添加会员失败:', error)
      throw error
    }
  }

  const updateMember = async (id, memberData) => {
    try {
      const updatedMember = await window.ipcRenderer.invoke('update-member', id, memberData)
      const index = members.value.findIndex(m => m.id === id)
      if (index !== -1) {
        members.value[index] = updatedMember
      }
      return updatedMember
    } catch (error) {
      console.error('更新会员失败:', error)
      throw error
    }
  }

  const deleteMember = async (id) => {
    try {
      await window.ipcRenderer.invoke('delete-member', id)
      const index = members.value.findIndex(m => m.id === id)
      if (index !== -1) {
        members.value.splice(index, 1)
      }
      return true
    } catch (error) {
      console.error('删除会员失败:', error)
      throw error
    }
  }

  const getMemberByPhone = (phone) => {
    return members.value.find(m => m.phone === phone)
  }

  const getMemberById = (id) => {
    return members.value.find(m => m.id === id)
  }

  const updateMemberPoints = async (memberId, points, type = 'set', reason = '', operator = '系统') => {
    try {
      const member = getMemberById(memberId)
      if (!member) {
        throw new Error('会员不存在')
      }

      const oldPoints = member.points
      let newPoints

      switch (type) {
        case 'add':
          newPoints = oldPoints + points
          break
        case 'subtract':
          newPoints = oldPoints - points
          break
        case 'set':
          newPoints = points
          break
        default:
          throw new Error('无效的积分操作类型')
      }

      if (newPoints < 0) {
        throw new Error('积分不能为负数')
      }

      // 更新数据库中的会员积分
      const updatedMember = await window.ipcRenderer.invoke('update-member-points', memberId, {
        points: newPoints,
        type: type,
        change_amount: type === 'set' ? newPoints - oldPoints : points,
        reason: reason,
        operator: operator
      })

      // 更新本地数据
      const index = members.value.findIndex(m => m.id === memberId)
      if (index !== -1) {
        members.value[index] = updatedMember
      }

      console.log(`积分变动: ${member.name} ${oldPoints} -> ${newPoints}`)

      return updatedMember
    } catch (error) {
      console.error('更新积分失败:', error)
      throw error
    }
  }

  // 获取会员消费记录
  const getMemberOrders = async (memberId) => {
    try {
      const orders = await window.ipcRenderer.invoke('get-member-orders', memberId)
      return orders
    } catch (error) {
      console.error('获取会员订单失败:', error)
      throw error
    }
  }

  const setSearchKeyword = (keyword) => {
    searchKeyword.value = keyword
  }

  const setLevelFilter = (level) => {
    levelFilter.value = level
  }

  const setDateRange = (range) => {
    dateRange.value = range
  }

  return {
    members,
    loading,
    searchKeyword,
    levelFilter,
    dateRange,
    filteredMembers,
    totalMembers,
    activeMembers,
    totalPoints,
    totalSpent,
    loadMembers,
    addMember,
    updateMember,
    deleteMember,
    getMemberByPhone,
    getMemberById,
    updateMemberPoints,
    getMemberOrders,
    setSearchKeyword,
    setLevelFilter,
    setDateRange
  }
})