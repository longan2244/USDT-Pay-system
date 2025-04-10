<script setup>
import { ref, computed } from 'vue'
import { useNotification } from '../composables/useNotification'

const props = defineProps({
  sidebarCollapsed: {
    type: Boolean,
    default: false
  },
  currentPage: {
    type: String,
    default: 'dashboard'
  },
  criticalSettingsMissing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-sidebar', 'change-page', 'logout', 'close-sidebar'])
const { showNotification } = useNotification()

const toggleSidebar = () => {
  emit('toggle-sidebar')
}

const changePage = (page) => {
  if (props.criticalSettingsMissing && page !== 'settings') {
    showNotification('warning', '系统配置不完整', '请先完成钱包地址和API密钥的配置')
    emit('change-page', 'settings')
    return
  }
  emit('change-page', page)
}

const logout = () => {
  emit('logout')
}

const closeSidebar = () => {
  emit('close-sidebar')
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <div class="sidebar-header">
      <div class="logo">
        <i class="ri-currency-line"></i>
        <span v-if="!sidebarCollapsed">USDT收款系统</span>
      </div>
      <button class="toggle-sidebar" @click="toggleSidebar">
        <i class="ri-menu-fold-line" v-if="!sidebarCollapsed"></i>
        <i class="ri-menu-unfold-line" v-else></i>
      </button>
    </div>
    <nav class="sidebar-nav">
      <ul>
        <!-- 只有在关键设置已配置时才显示这些菜单项 -->
        <li v-if="!criticalSettingsMissing" :class="{ active: currentPage === 'dashboard' }">
          <a href="#" @click.prevent="changePage('dashboard')">
            <i class="ri-dashboard-line"></i>
            <span v-if="!sidebarCollapsed">仪表盘</span>
          </a>
        </li>
        <li v-if="!criticalSettingsMissing" :class="{ active: currentPage === 'orders' }">
          <a href="#" @click.prevent="changePage('orders')">
            <i class="ri-file-list-3-line"></i>
            <span v-if="!sidebarCollapsed">订单管理</span>
          </a>
        </li>
        <li v-if="!criticalSettingsMissing" :class="{ active: currentPage === 'products' }">
          <a href="#" @click.prevent="changePage('products')">
            <i class="ri-shopping-bag-line"></i>
            <span v-if="!sidebarCollapsed">商品管理</span>
          </a>
        </li>
        <li v-if="!criticalSettingsMissing" :class="{ active: currentPage === 'cardkeys' }">
          <a href="#" @click.prevent="changePage('cardkeys')">
            <i class="ri-key-line"></i>
            <span v-if="!sidebarCollapsed">卡密管理</span>
          </a>
        </li>
        <!-- 设置菜单项始终显示 -->
        <li :class="{ active: currentPage === 'settings', 'critical-settings': criticalSettingsMissing }">
          <a href="#" @click.prevent="changePage('settings')">
            <i class="ri-settings-line"></i>
            <span v-if="!sidebarCollapsed">系统设置</span>
            <span v-if="criticalSettingsMissing && !sidebarCollapsed" class="settings-warning">
              <i class="ri-error-warning-line"></i>
            </span>
          </a>
        </li>
      </ul>
    </nav>
    <div class="sidebar-footer">
      <a href="#" @click.prevent="logout">
        <i class="ri-logout-box-line"></i>
        <span v-if="!sidebarCollapsed">退出登录</span>
      </a>
    </div>
  </aside>
  <!-- 侧边栏遮罩层，用于移动端 -->
  <div class="sidebar-overlay" @click="closeSidebar"></div>
</template>

<style lang="less" scoped>
// @import '../_styles/variables.less';


</style>
