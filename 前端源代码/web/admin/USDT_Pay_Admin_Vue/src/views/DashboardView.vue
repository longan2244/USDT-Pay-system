<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getDashboardData } from '../api/dashboard'
import Chart from 'chart.js/auto'
import StatCard from '../components/StatCard.vue'
import DataCard from '../components/DataCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import ProductProgress from '../components/ProductProgress.vue'
import DataTable from '../components/DataTable.vue'

const router = useRouter()

// 仪表盘数据
const dashboardData = ref({
  summary: {},
  productSales: [],
  salesTrend: [],
  recentOrders: []
})

// 加载状态
const loading = ref(false)
const salesChart = ref(null)
const chartInitialized = ref(false)

// 计算属性
const hasSalesTrendData = computed(() => {
  return dashboardData.value.salesTrend && dashboardData.value.salesTrend.length > 0
})

const hasProductSalesData = computed(() => {
  return dashboardData.value.productSales && dashboardData.value.productSales.length > 0
})

const hasRecentOrdersData = computed(() => {
  return dashboardData.value.recentOrders && dashboardData.value.recentOrders.length > 0
})

// 方法
const fetchDashboardData = async () => {
  loading.value = true
  try {
    const response = await getDashboardData()
    
    // 按可用卡密数量排序
    if (response.data.productSales) {
      response.data.productSales.sort((a, b) => a.availableCount - b.availableCount)
    }

    dashboardData.value = response.data

    // 确保在数据加载后初始化图表
    if (hasSalesTrendData.value) {
      initSalesChart()
    }
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
  } finally {
    loading.value = false
  }
}

const refreshDashboard = () => {
  fetchDashboardData()
}

const initSalesChart = () => {
  if (!hasSalesTrendData.value) return

  // 使用setTimeout确保DOM已经渲染
  setTimeout(() => {
    // 获取图表容器
    const chartElement = document.getElementById('salesChart')
    if (!chartElement) {
      console.error('销售图表容器不存在')
      return
    }

    // 销毁旧图表实例
    if (salesChart.value) {
      salesChart.value.destroy()
    }

    const salesData = dashboardData.value.salesTrend || []
    
    try {
      salesChart.value = new Chart(chartElement, {
        type: 'line',
        data: {
          labels: salesData.map(item => item.date),
          datasets: [
            {
              label: '销售额 (USDT)',
              data: salesData.map(item => item.revenue),
              borderColor: '#b14aed',
              backgroundColor: 'rgba(177, 74, 237, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true
            },
            {
              label: '订单数',
              data: salesData.map(item => item.count),
              borderColor: '#5ac8fa',
              backgroundColor: 'rgba(90, 200, 250, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#b3b3b3'
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(30, 30, 30, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#b3b3b3',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: '#808080'
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: '#808080'
              }
            },
            y1: {
              position: 'right',
              beginAtZero: true,
              grid: {
                display: false
              },
              ticks: {
                color: '#808080'
              }
            }
          }
        }
      });
      
      chartInitialized.value = true;
    } catch (error) {
      console.error('初始化销售图表失败:', error);
    }
  }, 100); // 延迟100ms确保DOM已渲染
}

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

const getStatusText = (status) => {
  switch (status) {
    case 'pending': return '待支付'
    case 'processing': return '处理中'
    case 'completed': return '已完成'
    case 'expired': return '已取消'
    default: return status
  }
}

const getStatusClass = (status) => {
  switch (status) {
    case 'pending': return 'status-warning'
    case 'processing': return 'status-info'
    case 'completed': return 'status-success'
    case 'expired': return 'status-danger'
    default: return ''
  }
}

const viewAllOrders = () => {
  router.push('/orders')
}

// 生命周期钩子
onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="dashboard-page">
    <div class="stats-cards">
      <StatCard 
        title="总订单数" 
        :value="dashboardData.summary?.totalOrders || 0" 
        description="全部订单总数" 
        icon="ri-shopping-cart-line"
      />
      <StatCard 
        title="已完成订单" 
        :value="dashboardData.summary?.completedOrders || 0" 
        description="成功支付的订单" 
        icon="ri-check-line"
      />
      <StatCard 
        title="待处理订单" 
        :value="dashboardData.summary?.pendingOrders || 0" 
        description="等待支付的订单" 
        icon="ri-time-line"
      />
      <StatCard 
        title="总收入" 
        :value="`${dashboardData.summary?.totalRevenue || 0} USDT`" 
        description="所有完成订单的总金额" 
        icon="ri-money-dollar-circle-line"
      />
    </div>

    <div class="dashboard-row">
      <DataCard 
        title="销售趋势" 
        :loading="loading"
        @refresh="refreshDashboard"
      >
        <div v-if="!hasSalesTrendData" class="empty-state">
          <i class="ri-line-chart-line"></i>
          <p>暂无销售趋势数据</p>
        </div>
        <div v-else class="chart-container">
          <canvas id="salesChart"></canvas>
        </div>
      </DataCard>

      <DataCard 
        title="商品销售情况" 
        :loading="loading"
        @refresh="refreshDashboard"
      >
        <div v-if="!hasProductSalesData" class="empty-state">
          <i class="ri-shopping-bag-line"></i>
          <p>暂无商品销售数据</p>
        </div>
        <div v-else class="product-list">
          <div v-for="product in dashboardData.productSales" :key="product.id" class="product-item">
            <div class="product-info">
              <h3>{{ product.name }}</h3>
              <div class="product-meta">
                <span class="product-sold">已售: {{ product.soldCount }}</span>
                <span class="product-available" :class="product.availableCount <= 5 ? 'status-badge status-danger' : ''">
                  可用: {{ product.availableCount }}
                </span>
              </div>
            </div>
            <ProductProgress :sold-count="product.soldCount" :available-count="product.availableCount" />
          </div>
        </div>
      </DataCard>
    </div>

    <DataCard 
      title="最近订单" 
      :loading="loading"
      @refresh="refreshDashboard"
      @view-all="viewAllOrders"
    >
      <div v-if="!hasRecentOrdersData" class="empty-state">
        <i class="ri-file-list-3-line"></i>
        <p>暂无订单数据</p>
      </div>
      <div v-else>
        <DataTable 
          :headers="[
            { text: '订单ID', value: 'id', formatter: (value) => value.substring(0, 8) + '...' },
            { text: '商品', value: 'productName' },
            { text: '金额', value: 'amount', formatter: (value) => `${value} USDT` },
            { text: '状态', value: 'status', type: 'status' },
            { text: '创建时间', value: 'createdAt', formatter: formatDate }
          ]" 
          :data="dashboardData.recentOrders" 
          :loading="false"
          empty-text="暂无订单数据"
          empty-icon="ri-file-list-3-line"
        />
      </div>
    </DataCard>
  </div>
</template>

<style lang="less" scoped>
// @import '../styles/components.less';
</style>
