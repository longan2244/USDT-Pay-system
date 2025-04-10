<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getCardKeys, addCardKeys, deleteCardKey as deleteCardKeyApi, batchDeleteCardKeys as batchDeleteCardKeysApi } from '../api/cardKeys'
import { getProducts } from '../api/products'
import FilterCard from '../components/FilterCard.vue'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import ModalDialog from '../components/ModalDialog.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useNotification } from '../composables/useNotification'

// 获取通知方法
const { showNotification } = useNotification()

const route = useRoute()

// 卡密数据
const cardKeys = ref([])
const products = ref([])
const selectedCardKeys = ref([])
const selectedProduct = ref({})

// 过滤条件
const cardKeyFilters = ref({
  status: 'all',
  productId: '',
  search: ''
})

// 分页
const pagination = ref({
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 0
})

// 模态框
const showModal = ref(false)
const modalType = ref('')
const modalTitle = ref('')

// 卡密表单
const cardKeyForm = ref({
  productId: '',
  keys: '',
  delimiter: '#',
  useDelimiter: false,
  removeDuplicates: false
})

// 预览卡密
const previewCardKeys = ref([])
const previousModalType = ref('')
const previousModalTitle = ref('')

// 加载状态
const loading = ref(false)

// 格式化日期函数
const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 表格列定义
const tableHeaders = [
  { text: 'ID', value: 'id', formatter: (value) => value.substring(0, 8) + '...' },
  { text: '卡密', value: 'key', style: { flex: '2' } },
  { text: '商品', value: 'productName' },
  { 
    text: '状态', 
    value: 'status', 
    type: 'status', 
    formatter: (value, item) => ({
      status: item.orderId ? 'used' : 'available',
      text: item.orderId ? '已使用' : '可用'
    })
  },
  { text: '创建时间', value: 'createdAt', formatter: formatDate },
  { text: '使用时间', value: 'usedAt', formatter: (value) => value ? formatDate(value) : '-' },
  { 
    text: '操作', 
    value: 'actions', 
    type: 'actions',
    actions: [
      { 
        action: 'delete', 
        icon: 'ri-delete-bin-line',
        condition: (item) => !item.orderId
      }
    ]
  }
]

// 计算属性
const hasSelectedCardKeys = computed(() => {
  return selectedCardKeys.value.length > 0
})

const activeProducts = computed(() => {
  return products.value.filter(product => product.status === 'active')
})

// 方法
const fetchCardKeys = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }

    // 只添加非空的过滤条件
    if (cardKeyFilters.value.status && cardKeyFilters.value.status !== 'all') {
      params.status = cardKeyFilters.value.status
    }

    if (cardKeyFilters.value.productId) {
      params.productId = cardKeyFilters.value.productId
    }

    if (cardKeyFilters.value.search) {
      params.search = cardKeyFilters.value.search
    }

    // 获取卡密数据
    const response = await getCardKeys(params)
 
    // 由于在request.js中已经处理了响应拦截，这里直接使用返回的数据
    cardKeys.value = response.data
    


    // 更新分页信息
    if (response.pagination) {
      pagination.value = {
        ...pagination.value,
        ...response.pagination
      }
    }
  } catch (error) {
    console.error('获取卡密列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchProducts = async () => {
  try {
    const params = { 
      pageSize: 100,  // 获取足够多的商品用于过滤
      status: 'active'
    }
    
    const response = await getProducts(params)
    
    // 由于在request.js中已经处理了响应拦截，这里直接使用返回的数据
    products.value = response.data
    
    // 如果URL中有productId参数，自动设置过滤条件
    const productId = route.query.productId
    if (productId) {
      cardKeyFilters.value.productId = productId
      applyCardKeyFilters()
    }
    
    // 如果有商品，默认选择第一个
    if (activeProducts.value.length > 0 && !cardKeyForm.value.productId) {
      cardKeyForm.value.productId = activeProducts.value[0].id
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
  }
}

const refreshCardKeys = () => {
  // 重置到第一页
  pagination.value.page = 1
  fetchCardKeys()
}

// 应用卡密过滤条件
const applyCardKeyFilters = () => {
  pagination.value.page = 1 // 重置到第一页
  fetchCardKeys()
}

// 重置卡密过滤条件
const resetCardKeyFilters = () => {
  cardKeyFilters.value = {
    status: 'all',
    productId: '',
    search: ''
  }
  pagination.value.page = 1
  fetchCardKeys()
}

// 卡密分页方法
const handlePageChange = (page) => {
  pagination.value.page = page
  fetchCardKeys()
}

const handleRowAction = ({ action, item }) => {
  if (action === 'delete') {
    deleteCardKey(item)
  }
}

const showAddCardKeyModal = () => {
  if (activeProducts.value.length === 0) {
    // 显示错误提示
    return
  }

  cardKeyForm.value = {
    productId: activeProducts.value[0].id,
    keys: '',
    delimiter: '#',
    useDelimiter: false,
    removeDuplicates: false
  }
  previewCardKeys.value = []
  modalType.value = 'addCardKey'
  modalTitle.value = '添加卡密'
  showModal.value = true
}

const closeModal = () => {
  // 如果当前是预览模式，返回到添加卡密表单
  if (modalType.value === 'previewCardKeys' && previousModalType.value) {
    modalType.value = previousModalType.value
    modalTitle.value = previousModalTitle.value
  } else {
    showModal.value = false
  }
}

const submitModal = async () => {
  if (modalType.value === 'addCardKey') {
    await submitCardKeys()
  } else if (modalType.value === 'previewCardKeys') {
    // 返回到添加卡密表单，恢复之前保存的状态
    modalType.value = previousModalType.value || 'addCardKey'
    modalTitle.value = previousModalTitle.value || (selectedProduct.value ?
      `添加卡密 - ${selectedProduct.value.name}` :
      '添加卡密')
  } else {
    closeModal()
  }
}

const previewCardKeysSplit = () => {
  if (!cardKeyForm.value.keys.trim()) {
    // 显示错误提示
    return
  }

  // 根据分隔方式分割卡密
  let keyArray = []
  if (cardKeyForm.value.useDelimiter) {
    // 使用自定义分隔符
    const delimiter = cardKeyForm.value.delimiter || '#'
    keyArray = cardKeyForm.value.keys.split(delimiter)
  } else {
    // 使用换行符
    keyArray = cardKeyForm.value.keys.split('\n')
  }

  // 过滤空字符串并去除前后空格
  keyArray = keyArray.map(key => key.trim()).filter(key => key)

  // 如果需要去重
  if (cardKeyForm.value.removeDuplicates) {
    keyArray = [...new Set(keyArray)]
  }

  previewCardKeys.value = keyArray

  // 保存当前的表单状态，以便返回时恢复
  previousModalType.value = modalType.value
  previousModalTitle.value = modalTitle.value

  // 切换到预览模式
  modalType.value = 'previewCardKeys'
  modalTitle.value = '卡密预览'
}

const submitCardKeys = async () => {
  if (!cardKeyForm.value.productId || !cardKeyForm.value.keys.trim()) {
    // 显示错误提示
    showNotification('error', '提交失败', '请填写完整的卡密信息')
    return
  }

  try {
    // 准备请求参数
    const requestData = {
      productId: cardKeyForm.value.productId,
      keys: cardKeyForm.value.keys,
      removeDuplicates: cardKeyForm.value.removeDuplicates
    }

    // 如果使用自定义分隔符，添加到请求中
    if (cardKeyForm.value.useDelimiter && cardKeyForm.value.delimiter) {
      requestData.delimiter = cardKeyForm.value.delimiter
    }

    // 发送批量添加卡密请求
    await addCardKeys(requestData)

    // 由于在request.js中已经处理了响应拦截，这里直接关闭模态框并刷新数据
    showNotification('success', '添加成功', '卡密已成功添加')
    closeModal()
    fetchCardKeys()
  } catch (error) {
    console.error('添加卡密失败:', error)
    showNotification('error', '添加失败', error.message || '添加卡密时发生错误')
  }
}

const deleteCardKey = async (cardKey) => {
  try {
    await deleteCardKeyApi(cardKey.id)

    // 由于在request.js中已经处理了响应拦截，这里直接更新UI
    // 如果被删除的卡密在选中列表中，也从选中列表中移除
    const index = selectedCardKeys.value.findIndex(item => item.id === cardKey.id)
    if (index !== -1) {
      selectedCardKeys.value.splice(index, 1)
    }
    showNotification('success', '删除成功', '卡密已成功删除')
    fetchCardKeys()
  } catch (error) {
    console.error('删除卡密失败:', error)
    showNotification('error', '删除失败', error.message || '删除卡密时发生错误')
  }
}

const toggleSelectCardKey = (cardKey) => {
  const index = selectedCardKeys.value.findIndex(item => item.id === cardKey.id)
  if (index === -1) {
    selectedCardKeys.value.push(cardKey)
  } else {
    selectedCardKeys.value.splice(index, 1)
  }
}

const isCardKeySelected = (cardKey) => {
  return selectedCardKeys.value.some(item => item.id === cardKey.id)
}

const toggleSelectAllCardKeys = () => {
  if (selectedCardKeys.value.length === cardKeys.value.length) {
    // 如果已经全选，则取消全选
    selectedCardKeys.value = []
  } else {
    // 否则全选
    selectedCardKeys.value = [...cardKeys.value]
  }
}

const batchDeleteCardKeys = async () => {
  if (selectedCardKeys.value.length === 0) {
    // 显示错误提示
    showNotification('warning', '请选择卡密', '请先选择要删除的卡密')
    return
  }

  try {
    const cardKeyIds = selectedCardKeys.value.map(cardKey => cardKey.id)
    await batchDeleteCardKeysApi({
      ids: cardKeyIds
    })

    // 由于在request.js中已经处理了响应拦截，这里直接更新UI
    showNotification('success', '批量删除成功', `已成功删除 ${selectedCardKeys.value.length} 个卡密`)
    selectedCardKeys.value = [] // 清空选中列表
    fetchCardKeys()
  } catch (error) {
    console.error('批量删除卡密失败:', error)
    showNotification('error', '批量删除失败', error.message || '批量删除卡密时发生错误')
  }
}


// 生命周期钩子
onMounted(() => {
  fetchCardKeys()
  fetchProducts()
})
</script>

<template>
  <div class="cardkeys-page">

    <div class="page-header">
      <h2>卡密管理</h2>
      <div class="header-actions">
        <button class="btn-primary" @click="showAddCardKeyModal">
          <i class="ri-add-line"></i> 添加卡密
        </button>
        <button class="btn-secondary" @click="refreshCardKeys">
          <i class="ri-refresh-line"></i> 刷新
        </button>
      </div>
    </div>

    <!-- 卡密过滤条件 -->
    <FilterCard @reset="resetCardKeyFilters" @apply="applyCardKeyFilters">
      <div class="filter-row">
        <div class="filter-item">
          <label>卡密状态</label>
          <select v-model.trim="cardKeyFilters.status" class="select-input">
            <option value="all">全部卡密</option>
            <option value="available">可用卡密</option>
            <option value="used">已使用</option>
          </select>
        </div>
        <div class="filter-item">
          <label>商品</label>
          <select v-model.trim="cardKeyFilters.productId" class="select-input">
            <option value="">全部商品</option>
            <option v-for="product in products" :key="product.id" :value="product.id">
              {{ product.name }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label>搜索</label>
          <input type="text" v-model.trim="cardKeyFilters.search" class="form-input" placeholder="卡密/商品名称">
        </div>
      </div>
    </FilterCard>

    <div class="data-card">
      <div class="batch-actions" v-if="hasSelectedCardKeys">
        <button class="btn-danger" @click="batchDeleteCardKeys">
          <i class="ri-delete-bin-line"></i> 批量删除 ({{ selectedCardKeys.length }})
        </button>
      </div>

      <DataTable 
        :headers="tableHeaders" 
        :data="cardKeys" 
        :loading="loading"
        empty-text="没有找到卡密"
        empty-icon="ri-key-line"
        @row-action="handleRowAction"
      />
      
      <!-- 分页控件 -->
      <Pagination 
        v-if="pagination.totalPages > 1"
        :page="pagination.page"
        :total-pages="pagination.totalPages"
        :total-items="pagination.totalItems"
        @page-change="handlePageChange"
      />
    </div>

    <!-- 模态框 -->
    <ModalDialog 
      :show="showModal" 
      :title="modalTitle" 
      :modal-type="modalType"
      @close="closeModal"
      @submit="submitModal"
    >
      <!-- 添加卡密表单 -->
      <div v-if="modalType === 'addCardKey'" class="modal-form">
        <div class="form-group">
          <label>选择商品</label>
          <select v-model.trim="cardKeyForm.productId" class="form-input">
            <option v-for="product in activeProducts" :key="product.id" :value="product.id">
              {{ product.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>分割方式</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model="cardKeyForm.useDelimiter" :value="false">
              <span>换行分割</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="cardKeyForm.useDelimiter" :value="true">
              <span>自定义分隔符</span>
            </label>
          </div>
        </div>
        <div class="form-group" v-if="cardKeyForm.useDelimiter">
          <label>分隔符</label>
          <input type="text" v-model.trim="cardKeyForm.delimiter" class="form-input" placeholder="请输入分隔符，默认为#">
        </div>
        <div class="form-group">
          <label>去重</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="cardKeyForm.removeDuplicates">
              <span>自动去除重复卡密</span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>卡密</label>
          <textarea v-model.trim="cardKeyForm.keys" class="form-textarea" :placeholder="cardKeyForm.useDelimiter ? 
              `请输入卡密，使用 ${cardKeyForm.delimiter || '#'} 分割多个卡密` : 
              '请输入卡密，多个卡密请换行输入'"></textarea>
        </div>
        <div class="form-actions">
          <button class="btn-secondary" @click="previewCardKeysSplit">预览分割结果</button>
        </div>
      </div>

      <!-- 卡密预览 -->
      <div v-if="modalType === 'previewCardKeys'" class="modal-form">
        <div class="preview-header">
          <h3>卡密预览 (共 {{ previewCardKeys.length }} 个)</h3>
        </div>
        <div class="preview-list">
          <div v-if="previewCardKeys.length === 0" class="empty-preview">
            <p>没有有效的卡密</p>
          </div>
          <div v-else class="preview-items">
            <div v-for="(key, index) in previewCardKeys" :key="index" class="preview-item">
              <span>{{ index + 1 }}. {{ key }}</span>
            </div>
          </div>
        </div>
      </div>
    </ModalDialog>
  </div>
</template>

<style lang="less" scoped>

</style>
