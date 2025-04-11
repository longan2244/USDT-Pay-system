<script setup>
import { ref, onMounted, computed } from 'vue'
import { getOrders, updateOrderStatus, confirmPayment } from '../api/orders'
import { getProducts } from '../api/products'
import FilterCard from '../components/FilterCard.vue'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import ModalDialog from '../components/ModalDialog.vue'
import StatusBadge from '../components/StatusBadge.vue'

// 订单数据
const orders = ref([])
const products = ref([])
const selectedOrder = ref({})

// 过滤条件
const orderFilters = ref({
  status: 'all',
  productId: '',
  startDate: '',
  endDate: '',
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

// 支付确认表单
const paymentForm = ref({
  txHash: ''
})

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
  { text: '订单ID', value: 'id', formatter: (value) => value.substring(0, 8) + '...' },
  { text: '商品', value: 'items', formatter: (_, item) => formatOrderProducts(item) },
  { text: '金额', value: 'amount', formatter: (value) => `${value} USDT` },
  { text: '状态', value: 'status', type: 'status' },
  { text: '创建时间', value: 'createdAt', formatter: formatDate },
  {
    text: '操作',
    value: 'actions',
    type: 'actions',
    actions: [
      {
        action: 'view',
        icon: 'ri-eye-line'
      },
      {
        action: 'confirm',
        icon: 'ri-check-line',
        condition: (item) => item.status === 'pending'
      }
    ]
  }
]

// 方法
const fetchOrders = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }

    // 只添加非空的过滤条件
    if (orderFilters.value.status && orderFilters.value.status !== 'all') {
      params.status = orderFilters.value.status
    }

    if (orderFilters.value.productId) {
      params.productId = orderFilters.value.productId
    }

    if (orderFilters.value.startDate) {
      params.startDate = orderFilters.value.startDate
    }

    if (orderFilters.value.endDate) {
      params.endDate = orderFilters.value.endDate
    }

    if (orderFilters.value.search) {
      params.search = orderFilters.value.search
    }

    // 获取订单数据
    const response = await getOrders(params)

    // 由于在request.js中已经处理了响应拦截，这里直接使用返回的数据
    orders.value = response.data

    // 更新分页信息
    if (response.pagination) {
      pagination.value = {
        ...pagination.value,
        ...response.pagination
      }
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
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
  } catch (error) {
    console.error('获取商品列表失败:', error)
  }
}

const refreshOrders = () => {
  // 重置到第一页
  pagination.value.page = 1
  fetchOrders()
}

// 应用订单过滤条件
const applyOrderFilters = () => {
  pagination.value.page = 1 // 重置到第一页
  fetchOrders()
}

// 重置订单过滤条件
const resetOrderFilters = () => {
  orderFilters.value = {
    status: 'all',
    productId: '',
    startDate: '',
    endDate: '',
    search: ''
  }
  pagination.value.page = 1
  fetchOrders()
}

// 订单分页方法
const handlePageChange = (page) => {
  pagination.value.page = page
  fetchOrders()
}

const handleRowAction = ({ action, item }) => {
  selectedOrder.value = item

  if (action === 'view') {
    modalType.value = 'orderDetails'
    modalTitle.value = '订单详情'
    showModal.value = true
  } else if (action === 'confirm') {
    modalType.value = 'confirmPayment'
    modalTitle.value = '确认支付'
    paymentForm.value.txHash = ''
    showModal.value = true
  }
}

const closeModal = () => {
  showModal.value = false
}

const submitModal = async () => {
  if (modalType.value === 'confirmPayment') {
    await submitConfirmPayment()
  } else {
    closeModal()
  }
}

const submitConfirmPayment = async () => {
  if (!paymentForm.value.txHash) {
    return // 显示错误提示
  }

  try {
    const response = await confirmPayment({
      orderId: selectedOrder.value.id,
      txHash: paymentForm.value.txHash
    })

    // 由于在request.js中已经处理了响应拦截，这里直接使用返回的数据
    closeModal()
    fetchOrders()
  } catch (error) {
    console.error('确认支付失败:', error)
  }
}


const formatOrderProducts = (order) => {
  // 如果是单商品订单
  if (order.productName) {
    return order.productName
  }

  // 如果是多商品订单
  if (order.items && order.items.length > 0) {
    // 提取所有商品名称
    const productNames = order.items.map(item => {
      if (item.quantity > 1) {
        return `${item.productName} x${item.quantity}`
      }
      return item.productName
    })

    // 如果商品数量超过2个，只显示前2个并加上"等"
    if (productNames.length > 2) {
      return productNames.slice(0, 2).join(', ') + ' 等'
    }

    // 否则显示所有商品，用逗号分隔
    return productNames.join(', ')
  }

  // 如果没有商品信息，返回默认文本
  return '未知商品'
}

// 生命周期钩子
onMounted(() => {
  fetchOrders()
  fetchProducts()
})
</script>

<template>
  <div class="orders-page">
    <div class="page-header">
      <h2>订单管理</h2>
      <div class="header-actions">
        <button class="btn-primary" @click="refreshOrders">
          <i class="ri-refresh-line"></i> 刷新
        </button>
      </div>
    </div>

    <!-- 订单过滤条件 -->
    <FilterCard @reset="resetOrderFilters" @apply="applyOrderFilters">
      <div class="filter-row">
        <div class="filter-item">
          <label>订单状态</label>
          <select v-model.trim="orderFilters.status" class="select-input">
            <option value="all">全部订单</option>
            <option value="pending">待支付</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <div class="filter-item">
          <label>商品</label>
          <select v-model.trim="orderFilters.productId" class="select-input">
            <option value="">全部商品</option>
            <option v-for="product in products" :key="product.id" :value="product.id">
              {{ product.name }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label>搜索</label>
          <input type="text" v-model.trim="orderFilters.search" class="form-input" placeholder="订单ID/商品名称/联系方式/付款地址">
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-item">
          <label>开始日期</label>
          <input type="date" v-model.trim="orderFilters.startDate" class="form-input">
        </div>
        <div class="filter-item">
          <label>结束日期</label>
          <input type="date" v-model.trim="orderFilters.endDate" class="form-input">
        </div>
      </div>
    </FilterCard>

    <div class="data-card">
      <DataTable :headers="tableHeaders" :data="orders" :loading="loading" empty-text="没有找到订单"
        empty-icon="ri-file-list-3-line" @row-action="handleRowAction" />

      <!-- 分页控件 -->
      <Pagination v-if="pagination.totalPages > 1" :page="pagination.page" :total-pages="pagination.totalPages"
        :total-items="pagination.totalItems" @page-change="handlePageChange" />
    </div>

    <!-- 模态框 -->
    <ModalDialog :show="showModal" :title="modalTitle" :modal-type="modalType" @close="closeModal"
      @submit="submitModal">
      <!-- 订单详情 -->
      <div v-if="modalType === 'orderDetails'" class="order-details">
        <div class="detail-group">
          <span class="detail-label">订单ID:</span>
          <span class="detail-value">{{ selectedOrder.id }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">商品:</span>
          <span class="detail-value">{{ formatOrderProducts(selectedOrder) }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">金额:</span>
          <span class="detail-value">{{ selectedOrder.amount }} USDT</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">状态:</span>
          <span class="detail-value">
            <StatusBadge :status="selectedOrder.status" />
          </span>
        </div>
        <div class="detail-group">
          <span class="detail-label">创建时间:</span>
          <span class="detail-value">{{ formatDate(selectedOrder.createdAt) }}</span>
        </div>
        <div class="detail-group" v-if="selectedOrder.txHash">
          <span class="detail-label" style="white-space: nowrap;">交易哈希:</span>
          <span class="detail-value">{{ selectedOrder.txHash }}</span>
        </div>
        <div class="detail-group" v-if="selectedOrder.txHash">
          <span class="detail-label">付款地址:</span>
          <span class="detail-value">{{ selectedOrder.paymentInfo?.from }}</span>
        </div>
        <div class="detail-group" v-if="selectedOrder.cardKey">
          <span class="detail-label">卡密:</span>
          <span class="detail-value">{{ selectedOrder.cardKey }}</span>
        </div>
        <div v-if="selectedOrder.cardKeys && selectedOrder.cardKeys.length > 0">
          <h3>卡密列表</h3>
          <div class="card-keys-list">
            <div v-for="(card, index) in selectedOrder.cardKeys" :key="index" class="card-key-item">
              <span>{{ card.productName }}: </span>
              <span class="card-key-value">{{ card.key }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 确认支付表单 -->
      <div v-if="modalType === 'confirmPayment'" class="modal-form">
        <div class="form-group">
          <label>订单ID</label>
          <input type="text" :value="selectedOrder.id" class="form-input" disabled>
        </div>
        <div class="form-group">
          <label>金额</label>
          <input type="text" :value="selectedOrder.amount + ' USDT'" class="form-input" disabled>
        </div>
        <div class="form-group">
          <label>交易哈希</label>
          <input type="text" v-model.trim="paymentForm.txHash" class="form-input" placeholder="请输入交易哈希">
        </div>
      </div>
    </ModalDialog>
  </div>
</template>

<style lang="less" scoped>
.orders-page {
  width: 100%;
}

.data-card {
  overflow-x: auto;
  /* 添加水平滚动 */
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
  /* 提升iOS设备上的滚动体验 */
}

/* 确保表格内容在移动设备上正确显示 */
:deep(.data-table) {
  min-width: 800px;
  /* 设置最小宽度确保内容完整显示 */
  table-layout: fixed;
}

/* 订单详情样式优化 */
.order-details {
  .detail-group {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 10px;

    .detail-label {
      font-weight: bold;
      min-width: 80px;
      margin-right: 10px;
    }

    .detail-value {
      flex: 1;
      word-break: break-word;
      /* 确保长文本可以换行 */
    }
  }
}

/* 卡密列表样式 */
.card-keys-list {
  margin-top: 10px;

  .card-key-item {
    padding: 5px 0;
    border-bottom: 1px solid #eee;

    .card-key-value {
      word-break: break-all;
      /* 确保卡密值可以换行 */
    }
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;

    .filter-item {
      width: 100%;
      margin-bottom: 10px;
    }
  }

  .header-actions {
    margin-top: 10px;
  }
}
</style>
