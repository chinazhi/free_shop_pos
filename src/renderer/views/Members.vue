<template>
  <div class="members-page">
    <div class="page-header">
      <h2>会员管理</h2>
      <p>管理会员信息，查看会员消费记录</p>
    </div>

    <!-- 会员统计 -->
    <div class="stats-grid">
      <div class="stats-card">
        <div class="stats-icon" style="background: #409eff">
          <el-icon><User /></el-icon>
        </div>
        <div class="stats-content">
          <h3>{{ totalMembers }}</h3>
          <p>会员总数</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon" style="background: #67c23a">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="stats-content">
          <h3>{{ activeMembers }}</h3>
          <p>活跃会员</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon" style="background: #e6a23c">
          <el-icon><Star /></el-icon>
        </div>
        <div class="stats-content">
          <h3>{{ totalPoints }}</h3>
          <p>总积分</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon" style="background: #f56c6c">
          <el-icon><Money /></el-icon>
        </div>
        <div class="stats-content">
          <h3>¥{{ totalSpent.toFixed(2) }}</h3>
          <p>总消费额</p>
        </div>
      </div>
    </div>

    <!-- 搜索和操作栏 -->
    <div class="search-bar">
      <el-row :gutter="20" align="middle">
        <el-col :span="6">
          <el-input
            :model-value="membersStore.searchKeyword"
            @input="handleSearch"
            placeholder="搜索会员姓名或手机号"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select 
            :model-value="membersStore.levelFilter" 
            @change="handleLevelFilter"
            placeholder="会员等级" 
            clearable
          >
            <el-option label="全部等级" value="" />
            <el-option label="青铜会员" value="bronze" />
            <el-option label="白银会员" value="silver" />
            <el-option label="黄金会员" value="gold" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            :model-value="membersStore.dateRange"
            @change="handleDateRangeFilter"
            type="daterange"
            range-separator="至"
            start-placeholder="注册开始日期"
            end-placeholder="注册结束日期"
            size="default"
          />
        </el-col>
        <el-col :span="8">
          <div class="button-group">
            <el-button type="primary" @click="showAddDialog = true">
              <el-icon><Plus /></el-icon>
              添加会员
            </el-button>
            <el-button @click="handleExport">
              <el-icon><Download /></el-icon>
              导出会员
            </el-button>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 会员表格 -->
    <div class="table-container">
      <el-table
        :data="filteredMembers"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="member_no" label="会员号" width="120" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="level" label="等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.level)" size="small">
              {{ getLevelText(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="100" align="center">
          <template #default="{ row }">
            <el-text type="warning">{{ row.points }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="total_spent" label="累计消费" width="120" align="right">
          <template #default="{ row }">
            ¥{{ (row.total_spent || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewMember(row)">
              详情
            </el-button>
            <el-button type="warning" size="small" @click="editMember(row)">
              编辑
            </el-button>
            <el-button type="success" size="small" @click="adjustPoints(row)">
              积分
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredMembers.length"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </div>

    <!-- 添加/编辑会员对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingMember ? '编辑会员' : '添加会员'"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="memberFormRef"
        :model="memberForm"
        :rules="memberRules"
        label-width="80px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="memberForm.name" placeholder="会员姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="memberForm.phone" placeholder="手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="memberForm.email" placeholder="邮箱地址" />
        </el-form-item>
        <el-form-item label="等级">
          <el-select v-model="memberForm.level" placeholder="选择等级" style="width: 100%">
            <el-option label="青铜会员" value="bronze" />
            <el-option label="白银会员" value="silver" />
            <el-option label="黄金会员" value="gold" />
          </el-select>
        </el-form-item>
        <el-form-item label="初始积分">
          <el-input-number
            v-model="memberForm.points"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="生日">
          <el-date-picker
            v-model="memberForm.birthday"
            type="date"
            placeholder="选择生日"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="地址">
          <el-input
            v-model="memberForm.address"
            placeholder="请输入地址"
            type="textarea"
            :rows="2"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="memberForm.notes"
            placeholder="备注信息"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMember">保存</el-button>
      </template>
    </el-dialog>

    <!-- 会员详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="会员详情"
      width="800px"
    >
      <div v-if="selectedMember" class="member-detail">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="detail-item">
                <label>会员号：</label>
                <span>{{ selectedMember.member_no }}</span>
              </div>
              <div class="detail-item">
                <label>姓名：</label>
                <span>{{ selectedMember.name }}</span>
              </div>
              <div class="detail-item">
                <label>手机号：</label>
                <span>{{ selectedMember.phone }}</span>
              </div>
              <div class="detail-item">
                <label>邮箱：</label>
                <span>{{ selectedMember.email }}</span>
              </div>
              <div class="detail-item">
                <label>等级：</label>
                <el-tag :type="getLevelTagType(selectedMember.level)">
                  {{ getLevelText(selectedMember.level) }}
                </el-tag>
              </div>
              <div class="detail-item">
                <label>注册时间：</label>
                <span>{{ formatDate(selectedMember.created_at) }}</span>
              </div>
              <div class="detail-item">
                <label>生日：</label>
                <span>{{ selectedMember.birthday || '未设置' }}</span>
              </div>
              <div class="detail-item">
                <label>地址：</label>
                <span>{{ selectedMember.address || '未设置' }}</span>
              </div>
              <div class="detail-item">
                <label>备注：</label>
                <span>{{ selectedMember.notes || '无' }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-section">
              <h4>消费统计</h4>
              <div class="detail-item">
                <label>当前积分：</label>
                <span class="highlight">{{ selectedMember.points }}</span>
              </div>
              <div class="detail-item">
                <label>累计消费：</label>
                <span class="highlight">¥{{ (selectedMember.total_spent || 0).toFixed(2) }}</span>
              </div>
              <div class="detail-item">
                <label>消费次数：</label>
                <span>{{ memberOrderCount }}</span>
              </div>
              <div class="detail-item">
                <label>平均消费：</label>
                <span>¥{{ (averageOrderAmount || 0).toFixed(2) }}</span>
              </div>
              <div class="detail-item">
                <label>最后消费：</label>
                <span>{{ lastOrderDate || '暂无消费记录' }}</span>
              </div>
            </div>
          </el-col>
        </el-row>
        
        <!-- 消费记录 -->
        <div class="detail-section">
          <h4>最近消费记录</h4>
          <el-table :data="memberOrders" size="small">
            <el-table-column prop="order_no" label="订单号" width="150" />
            <el-table-column prop="total_amount" label="消费金额" width="100" align="right">
              <template #default="{ row }">
                ¥{{ (row.total_amount || 0).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="points_earned" label="获得积分" width="100" align="center" />
            <el-table-column prop="created_at" label="消费时间">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 积分调整对话框 -->
    <el-dialog
      v-model="showPointsDialog"
      title="积分调整"
      width="400px"
    >
      <el-form label-width="100px">
        <el-form-item label="会员姓名">
          <el-text>{{ pointsAdjustMember?.name }}</el-text>
        </el-form-item>
        <el-form-item label="当前积分">
          <el-text type="warning">{{ pointsAdjustMember?.points }}</el-text>
        </el-form-item>
        <el-form-item label="调整类型">
          <el-radio-group v-model="pointsAdjustType">
            <el-radio label="add">增加</el-radio>
            <el-radio label="subtract">扣除</el-radio>
            <el-radio label="set">设置</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="积分数量">
          <el-input-number
            v-model="pointsAdjustAmount"
            :min="pointsAdjustType === 'subtract' ? 1 : (pointsAdjustType === 'set' ? 0 : 1)"
            :max="pointsAdjustType === 'subtract' ? pointsAdjustMember?.points : undefined"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input
            v-model="pointsAdjustReason"
            placeholder="积分调整原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPointsDialog = false">取消</el-button>
        <el-button type="primary" @click="savePointsAdjust">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMembersStore } from '../stores/members'

// 使用会员store
const membersStore = useMembersStore()

// 响应式数据
const currentPage = ref(1)
const pageSize = ref(20)
const selectedMembers = ref([])
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const showPointsDialog = ref(false)
const editingMember = ref(null)
const selectedMember = ref(null)
const pointsAdjustMember = ref(null)
const pointsAdjustType = ref('add')
const pointsAdjustAmount = ref(0)
const pointsAdjustReason = ref('')
const memberOrders = ref([])

// 表单数据
const memberForm = reactive({
  name: '',
  phone: '',
  email: '',
  level: 'bronze',
  points: 0,
  birthday: '',
  address: '',
  notes: ''
})

// 表单验证规则
const memberRules = {
  name: [{ required: true, message: '请输入会员姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const memberFormRef = ref()

// 计算属性 - 使用store中的数据
const filteredMembers = computed(() => membersStore.filteredMembers)
const totalMembers = computed(() => membersStore.totalMembers)
const activeMembers = computed(() => membersStore.activeMembers)
const totalPoints = computed(() => membersStore.totalPoints)
const totalSpent = computed(() => membersStore.totalSpent)

const memberOrderCount = computed(() => {
  return memberOrders.value.length
})

const averageOrderAmount = computed(() => {
  if (memberOrders.value.length === 0) return 0
  const total = memberOrders.value.reduce((sum, order) => sum + order.total_amount, 0)
  return total / memberOrders.value.length
})

const lastOrderDate = computed(() => {
  if (memberOrders.value.length === 0) return null
  const lastOrder = memberOrders.value[0]
  return formatDate(lastOrder.created_at)
})

// 方法
const handleSelectionChange = (selection) => {
  selectedMembers.value = selection
}

const getLevelTagType = (level) => {
  switch (level) {
    case 'gold': return 'warning'
    case 'silver': return 'info'
    case 'bronze': return 'success'
    default: return 'info'
  }
}

const getLevelText = (level) => {
  switch (level) {
    case 'gold': return '黄金会员'
    case 'silver': return '白银会员'
    case 'bronze': return '青铜会员'
    default: return '普通会员'
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const editMember = (member) => {
  editingMember.value = member
  // 只复制需要的字段，避免不可克隆的对象
  Object.assign(memberForm, {
    name: member.name || '',
    phone: member.phone || '',
    email: member.email || '',
    level: member.level || 'bronze',
    points: member.points || 0,
    birthday: member.birthday || '',
    address: member.address || '',
    notes: member.notes || ''
  })
  showAddDialog.value = true
}

const adjustPoints = (member) => {
  pointsAdjustMember.value = member
  pointsAdjustType.value = 'add'
  pointsAdjustAmount.value = 0
  pointsAdjustReason.value = ''
  showPointsDialog.value = true
}

const resetForm = () => {
  editingMember.value = null
  Object.assign(memberForm, {
    name: '',
    phone: '',
    email: '',
    level: 'bronze',
    points: 0,
    birthday: '',
    address: '',
    notes: ''
  })
  memberFormRef.value?.resetFields()
}

const saveMember = async () => {
  try {
    await memberFormRef.value.validate()
    
    // 创建普通对象副本，避免传递响应式对象
    const memberData = {
      name: (memberForm.name || '').trim(),
      phone: (memberForm.phone || '').trim(),
      email: (memberForm.email || '').trim(),
      level: memberForm.level || 'bronze',
      points: Number(memberForm.points) || 0,
      birthday: memberForm.birthday || '',
      address: (memberForm.address || '').trim(),
      notes: (memberForm.notes || '').trim()
    }
    
    if (editingMember.value) {
      // 更新会员
      await membersStore.updateMember(editingMember.value.id, memberData)
      ElMessage.success('会员信息更新成功')
    } else {
      // 添加会员
      await membersStore.addMember(memberData)
      ElMessage.success('会员添加成功')
    }
    
    showAddDialog.value = false
    resetForm()
    
    // 刷新会员列表数据
    await membersStore.loadMembers()
  } catch (error) {
    console.error('保存会员失败:', error)
    if (error !== false) {
      ElMessage.error('保存失败: ' + (error.message || '未知错误'))
    }
  }
}

const savePointsAdjust = async () => {
  if (!pointsAdjustAmount.value) {
    ElMessage.warning('请输入调整数量')
    return
  }
  
  try {
    const member = pointsAdjustMember.value
    
    await membersStore.updateMemberPoints(
      member.id,
      pointsAdjustAmount.value,
      pointsAdjustType.value,
      pointsAdjustReason.value || '手动调整',
      '管理员'
    )
    
    ElMessage.success('积分调整成功')
    showPointsDialog.value = false
    
    // 重置表单
    pointsAdjustAmount.value = 0
    pointsAdjustReason.value = ''
  } catch (error) {
    console.error('积分调整失败:', error)
    ElMessage.error('积分调整失败: ' + (error.message || '未知错误'))
  }
}

const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

// 查看会员详情时加载订单数据
const loadMemberOrders = async (memberId) => {
  try {
    memberOrders.value = await membersStore.getMemberOrders(memberId)
  } catch (error) {
    console.error('加载会员订单失败:', error)
    memberOrders.value = []
  }
}

// 重写viewMember方法以加载订单数据
const viewMember = async (member) => {
  selectedMember.value = member
  showDetailDialog.value = true
  await loadMemberOrders(member.id)
}

// 删除会员
const deleteMember = async (member) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除会员 "${member.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await membersStore.deleteMember(member.id)
    ElMessage.success('会员删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除会员失败:', error)
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
    }
  }
}

// 搜索和筛选方法
const handleSearch = (keyword) => {
  membersStore.setSearchKeyword(keyword)
}

const handleLevelFilter = (level) => {
  membersStore.setLevelFilter(level)
}

const handleDateRangeFilter = (range) => {
  membersStore.setDateRange(range)
}

onMounted(async () => {
  // 加载会员数据
  await membersStore.loadMembers()
})
</script>

<style scoped>
.members-page {
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

.search-bar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
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

.member-detail {
  padding: 0 20px;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.detail-item label {
  width: 100px;
  color: #666;
  font-size: 14px;
}

.detail-item span {
  color: #333;
  font-size: 14px;
}

.detail-item .highlight {
  color: #409eff;
  font-weight: 600;
  font-size: 16px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .search-bar .el-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .button-group {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>