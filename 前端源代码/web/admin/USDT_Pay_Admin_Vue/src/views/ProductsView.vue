<script setup>
import { ref, onMounted } from 'vue'
import { getProducts, createProduct, updateProduct } from '../api/products'
import FilterCard from '../components/FilterCard.vue'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import ModalDialog from '../components/ModalDialog.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useNotification } from '../composables/useNotification'
import { useRouter } from 'vue-router' // 添加这一行
// 获取通知方法
const { showNotification } = useNotification()
const router = useRouter() // 添加这一行
// 商品数据
const products = ref([])
const selectedProduct = ref({})

// 过滤条件
const productFilters = ref({
  status: 'all',
  minPrice: '',
  maxPrice: '',
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

// 商品表单
const productForm = ref({
  id: null,
  name: '',
  price: '',
  description: '',
  status: 'active'
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
  { text: 'ID', value: 'id' },
  { text: '商品名称', value: 'name' },
  { text: '价格', value: 'price', formatter: (value) => `${value} USDT` },
  { text: '已售', value: 'soldCount', formatter: (value) => value || 0 },
  { text: '可用卡密', value: 'availableCount', formatter: (value) => value || 0 },
  {
    text: '状态', value: 'status', type: 'status', formatter: (value) => ({
      status: value,
      text: value === 'active' ? '上架中' : '已下架'
    })
  },
  {
    text: '操作',
    value: 'actions',
    type: 'actions',
    actions: [
      {
        action: 'edit',
        icon: 'ri-edit-line'
      },
      {
        action: 'toggle',
        icon: (item) => item.status === 'active' ? 'ri-eye-off-line' : 'ri-eye-line'
      },
      {
        action: 'addKeys',
        icon: 'ri-key-line'
      }
    ]
  }
]

// 方法
const fetchProducts = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }

    // 只添加非空的过滤条件
    if (productFilters.value.status && productFilters.value.status !== 'all') {
      params.status = productFilters.value.status
    }

    if (productFilters.value.minPrice) {
      params.minPrice = productFilters.value.minPrice
    }

    if (productFilters.value.maxPrice) {
      params.maxPrice = productFilters.value.maxPrice
    }

    if (productFilters.value.search) {
      params.search = productFilters.value.search
    }

    // 获取商品数据
    const response = await getProducts(params)

    // 由于在request.js中已经处理了响应拦截，这里直接使用返回的数据
    products.value = response.data

    // 更新分页信息
    if (response.pagination) {
      pagination.value = {
        ...pagination.value,
        ...response.pagination
      }
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
  } finally {
    loading.value = false
  }
}

const refreshProducts = () => {
  // 重置到第一页
  pagination.value.page = 1
  fetchProducts()
}

// 应用商品过滤条件
const applyProductFilters = () => {
  pagination.value.page = 1 // 重置到第一页
  fetchProducts()
}

// 重置商品过滤条件
const resetProductFilters = () => {
  productFilters.value = {
    status: 'all',
    minPrice: '',
    maxPrice: '',
    search: ''
  }
  pagination.value.page = 1
  fetchProducts()
}

// 商品分页方法
const handlePageChange = (page) => {
  pagination.value.page = page
  fetchProducts()
}

const handleRowAction = ({ action, item }) => {
  selectedProduct.value = item

  if (action === 'edit') {
    modalType.value = 'editProduct'
    modalTitle.value = '编辑商品'
    productForm.value = { ...item }
    showModal.value = true
  } else if (action === 'toggle') {
    toggleProductStatus(item)
  } else if (action === 'addKeys') {
    // 修改这里：使用 router 进行导航而不是直接修改 window.location
    router.push({
      path: '/cardkeys',
      query: { productId: item.id }
    })
  }
}

const showAddProductModal = () => {
  productForm.value = {
    id: null,
    name: '',
    price: '',
    description: '',
    status: 'active'
  }
  modalType.value = 'addProduct'
  modalTitle.value = '添加商品'
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const submitModal = async () => {
  if (modalType.value === 'addProduct' || modalType.value === 'editProduct') {
    await submitProduct()
  } else {
    closeModal()
  }
}

const submitProduct = async () => {
  if (!productForm.value.name || !productForm.value.price) {
    showNotification('error', '提交失败', '请填写完整的商品信息')
    return
  }

  try {
    if (modalType.value === 'addProduct') {
      // 添加商品
      await createProduct({
        name: productForm.value.name,
        price: parseFloat(productForm.value.price),
        description: productForm.value.description
      })
      showNotification('success', '添加成功', '商品已成功添加')
    } else {
      // 编辑商品
      await updateProduct(productForm.value.id, {
        name: productForm.value.name,
        price: parseFloat(productForm.value.price),
        description: productForm.value.description,
        status: productForm.value.status
      })
      showNotification('success', '更新成功', '商品信息已成功更新')
    }

    // 由于在request.js中已经处理了响应拦截，这里直接关闭模态框并刷新数据
    closeModal()
    fetchProducts()
  } catch (error) {
    console.error('提交商品失败:', error)
    showNotification('error', '提交失败', error.message || '提交商品信息时发生错误')
  }
}

const toggleProductStatus = async (product) => {
  const newStatus = product.status === 'active' ? 'deleted' : 'active'
  const statusText = newStatus === 'active' ? '上架' : '下架'

  try {
    await updateProduct(product.id, {
      status: newStatus
    })

    // 由于在request.js中已经处理了响应拦截，这里直接刷新数据
    showNotification('success', `${statusText}成功`, `商品已成功${statusText}`)
    fetchProducts()
  } catch (error) {
    console.error('更新商品状态失败:', error)
    showNotification('error', `${statusText}失败`, error.message || `${statusText}商品时发生错误`)
  }
}

// 生命周期钩子
onMounted(() => {
  fetchProducts()
})
</script>

<template>
  <div class="products-page">
    <div class="page-header">
      <h2>商品管理</h2>
      <div class="header-actions">
        <button class="btn-primary" @click="showAddProductModal">
          <i class="ri-add-line"></i> 添加商品
        </button>
        <button class="btn-secondary" @click="refreshProducts">
          <i class="ri-refresh-line"></i> 刷新
        </button>
      </div>
    </div>

    <!-- 商品过滤条件 -->
    <FilterCard @reset="resetProductFilters" @apply="applyProductFilters">
      <div class="filter-row">
        <div class="filter-item">
          <label>商品状态</label>
          <select v-model.trim="productFilters.status" class="select-input">
            <option value="all">全部商品</option>
            <option value="active">上架中</option>
            <option value="deleted">已下架</option>
          </select>
        </div>
        <div class="filter-item">
          <label>最低价格</label>
          <input type="number" v-model.trim="productFilters.minPrice" class="form-input" placeholder="最低价格">
        </div>
        <div class="filter-item">
          <label>最高价格</label>
          <input type="number" v-model.trim="productFilters.maxPrice" class="form-input" placeholder="最高价格">
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-item">
          <label>搜索</label>
          <input type="text" v-model.trim="productFilters.search" class="form-input" placeholder="商品名称/描述">
        </div>
      </div>
    </FilterCard>

    <div class="data-card">
      <DataTable :headers="tableHeaders" :data="products" :loading="loading" empty-text="没有找到商品"
        empty-icon="ri-shopping-bag-line" @row-action="handleRowAction" />

      <!-- 分页控件 -->
      <Pagination v-if="pagination.totalPages > 1" :page="pagination.page" :total-pages="pagination.totalPages"
        :total-items="pagination.totalItems" @page-change="handlePageChange" />
    </div>

    <!-- 模态框 -->
    <ModalDialog :show="showModal" :title="modalTitle" :modal-type="modalType" @close="closeModal"
      @submit="submitModal">
      <!-- 添加/编辑商品表单 -->
      <div v-if="modalType === 'addProduct' || modalType === 'editProduct'" class="modal-form">
        <div class="form-group">
          <label>商品名称</label>
          <input type="text" v-model.trim="productForm.name" class="form-input" placeholder="请输入商品名称">
        </div>
        <div class="form-group">
          <label>价格 (USDT)</label>
          <input type="number" v-model.trim="productForm.price" class="form-input" placeholder="请输入价格">
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea v-model.trim="productForm.description" class="form-textarea" placeholder="请输入商品描述"></textarea>
        </div>
        <div class="form-group" v-if="modalType === 'editProduct'">
          <label>状态</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model.trim="productForm.status" value="active">
              <span>上架</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model.trim="productForm.status" value="deleted">
              <span>下架</span>
            </label>
          </div>
        </div>
      </div>
    </ModalDialog>
  </div>
</template>

<style lang="less" scoped>
.products-page {
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

/* 响应式调整 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;

    .header-actions {
      margin-top: 10px;
      width: 100%;
      display: flex;
      gap: 10px;

      button {
        flex: 1;
      }
    }
  }

  .filter-row {
    flex-direction: column;

    .filter-item {
      width: 100%;
      margin-bottom: 10px;
    }
  }

  /* 模态框内容响应式调整 */
  .modal-form {
    .form-group {
      margin-bottom: 15px;
    }

    .form-input,
    .form-textarea {
      width: 100%;
    }
  }
}
</style>
