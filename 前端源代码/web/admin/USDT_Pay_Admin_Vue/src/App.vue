<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SideBar from './components/SideBar.vue'
import HeaderBar from './components/HeaderBar.vue'
import Notification from './components/Notification.vue'
import LoadingSpinner from './components/LoadingSpinner.vue'
import { getSettings } from './api/settings'
import { useNotification } from './util/notification'

// 状态
const isLoading = ref(false)
const sidebarCollapsed = ref(false)
const currentPage = ref('dashboard')
const searchQuery = ref('')
const criticalSettingsMissing = ref(false)
const token = ref(localStorage.getItem('adminToken') || '')

// 通知
const { notification, showNotification, closeNotification } = useNotification()

const router = useRouter()
const route = useRoute()

// 计算属性
const pageTitle = computed(() => {
  switch (currentPage.value) {
    case 'dashboard': return '仪表盘'
    case 'orders': return '订单管理'
    case 'products': return '商品管理'
    case 'cardkeys': return '卡密管理'
    case 'settings': return '系统设置'
    case 'login': return '登录'
    default: return 'USDT收款系统'
  }
})

// 方法
const toggleSidebar = () => {
  if (window.innerWidth <= 768) {
    closeSidebar()
    return
  }
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleMobileMenu = () => {
  const sidebar = document.querySelector('.sidebar')
  const overlay = document.querySelector('.sidebar-overlay')

  if (sidebar && overlay) {
    sidebar.classList.toggle('active')
    overlay.classList.toggle('active')
  }
}

const closeSidebar = () => {
  const sidebar = document.querySelector('.sidebar')
  const overlay = document.querySelector('.sidebar-overlay')

  if (sidebar && overlay) {
    sidebar.classList.remove('active')
    overlay.classList.remove('active')
  }
}

const changePage = (page) => {
  if (criticalSettingsMissing.value && page !== 'settings') {
    showNotification('warning', '系统配置不完整', '请先完成钱包地址和API密钥的配置', 5000)
    router.push('/settings')
    return
  }
  // 在移动端视图下，切换页面时关闭侧边栏
  if (window.innerWidth <= 768) {
    closeSidebar()
  }

  router.push(`/${page}`)
}

const logout = () => {
  token.value = ''
  localStorage.removeItem('adminToken')
  showNotification('success', '退出成功', '您已成功退出登录')
  router.push('/login')
}



// 监听路由变化
watch(() => route.name, (newRouteName) => {
  if (newRouteName) {
    currentPage.value = newRouteName.toString()
    // 每次路由变化时检查关键设置
    if (token.value) {
      checkCriticalSettings()
    }
  }
}, { immediate: true })

// 监听token变化
watch(() => token.value, (newToken) => {
  if (newToken) {
    // token变化时检查关键设置
    checkCriticalSettings()
  } else {
    // 登出时重置状态
    criticalSettingsMissing.value = false
  }
})

// 生命周期钩子
onMounted(() => {
  // 检查是否需要从登录页面重定向并刷新
  const redirectToSettings = localStorage.getItem('redirectToSettings')
  if (redirectToSettings === 'true') {
    localStorage.removeItem('redirectToSettings')
    // 已经通过LoginView处理了刷新，这里不需要额外操作
  }
  
  // 检查关键设置
  if (token.value) {
    checkCriticalSettings()
  }

  // 添加侧滑手势支持（仅在移动端）
  if (window.innerWidth <= 768) {
    setupSwipeGesture()
  }
})

// 检查关键设置
const checkCriticalSettings = async () => {
  if (!token.value) return
  
  try {
    const response = await getSettings()
    const settings = response.data
    
    // 检查钱包地址和API密钥是否已配置
    criticalSettingsMissing.value = !settings.walletAddress || !settings.apiKey
    
    // 如果关键设置缺失且不在设置页面，显示通知并重定向
    if (criticalSettingsMissing.value && currentPage.value !== 'settings') {
      showNotification('warning', '系统配置不完整', '请先完成钱包地址和API密钥的配置', 5000)
      router.push('/settings')
    }
  } catch (error) {
    console.error('获取系统设置失败:', error)
  }
}

// 移动端侧滑手势
const setupSwipeGesture = () => {
  let touchStartX = 0
  let touchStartY = 0
  const minSwipeDistance = 50
  const maxSwipeTime = 300
  let touchStartTime = 0

  const handleTouchStart = (event) => {
    touchStartX = event.touches[0].clientX
    touchStartY = event.touches[0].clientY
    touchStartTime = Date.now()
  }

  const handleTouchEnd = (event) => {
    if (!event.changedTouches || !event.changedTouches[0]) return

    const touchEndX = event.changedTouches[0].clientX
    const touchEndY = event.changedTouches[0].clientY
    const touchEndTime = Date.now()

    // 计算水平和垂直滑动距离
    const distanceX = touchEndX - touchStartX
    const distanceY = Math.abs(touchEndY - touchStartY)

    // 计算滑动时间
    const swipeTime = touchEndTime - touchStartTime

    // 判断是否为有效的右滑手势
    if (
      distanceX > minSwipeDistance &&
      distanceY < distanceX / 2 &&
      swipeTime < maxSwipeTime &&
      touchStartX < window.innerWidth * 0.3
    ) {
      // 显示侧边栏
      const sidebar = document.querySelector('.sidebar')
      const overlay = document.querySelector('.sidebar-overlay')

      if (sidebar && !sidebar.classList.contains('active')) {
        sidebar.classList.add('active')
        if (overlay) overlay.classList.add('active')
      }
    }

    // 判断是否为有效的左滑手势(关闭侧边栏)
    if (
      distanceX < -minSwipeDistance &&
      distanceY < Math.abs(distanceX) / 2 &&
      swipeTime < maxSwipeTime
    ) {
      // 关闭侧边栏
      closeSidebar()
    }
  }

  document.addEventListener('touchstart', handleTouchStart, false)
  document.addEventListener('touchend', handleTouchEnd, false)
}
</script>

<template>
  <div id="app">
    <div class="app-container">
      <!-- 加载中 -->
      <LoadingSpinner :is-loading="isLoading" :full-screen="true" />

      <!-- 侧边栏 -->
      <SideBar :sidebar-collapsed="sidebarCollapsed" :current-page="currentPage"
        :critical-settings-missing="criticalSettingsMissing" @toggle-sidebar="toggleSidebar" @change-page="changePage"
        @logout="logout" @close-sidebar="closeSidebar" />

      <!-- 主内容区 -->
      <main class="main-content">
        <HeaderBar :page-title="pageTitle" v-model:search-query="searchQuery" @toggle-mobile-menu="toggleMobileMenu" />

        <router-view />
      </main>
    </div>

    <!-- 通知组件 -->
    <Notification :show="notification.show" :type="notification.type" :title="notification.title"
      :message="notification.message" :duration="notification.duration" @close="closeNotification" />
  </div>
</template>

<style lang="less">
// @import './_styles/variables.less';
// @import './_styles/main.less';
// @import './_styles/components.less';
@import './styles/index.css';
/* 引入Remix图标 */
@import url('https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css');

/* 引入Inter字体 */
// @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
</style>
