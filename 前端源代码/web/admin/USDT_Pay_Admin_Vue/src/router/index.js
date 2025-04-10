import { createRouter, createWebHashHistory } from 'vue-router'
import { nextTick } from 'vue'

// 视图组件
import DashboardView from '../views/DashboardView.vue'
import OrdersView from '../views/OrdersView.vue'
import ProductsView from '../views/ProductsView.vue'
import CardKeysView from '../views/CardKeysView.vue'
import SettingsView from '../views/SettingsView.vue'
import LoginView from '../views/LoginView.vue'


const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/orders',
      name: 'orders',
      component: OrdersView,
      meta: { requiresAuth: true }
    },
    {
      path: '/products',
      name: 'products',
      component: ProductsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/cardkeys',
      name: 'cardkeys',
      component: CardKeysView,
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    // 捕获所有未匹配的路由，重定向到仪表盘
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查用户是否已登录
  const isAuthenticated = !!localStorage.getItem('adminToken')

  // 如果路由需要认证且用户未登录，重定向到登录页面
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  }
  // 如果用户已登录且尝试访问登录页面，重定向到仪表盘
  else if (to.path === '/login' && isAuthenticated) {
    next('/dashboard')
  }
  // 其他情况正常导航
  else {
    next()
  }
})

// 路由切换后更新页面标题
router.afterEach((to) => {
  nextTick(() => {
    let title = 'USDT收款系统'

    switch (to.name) {
      case 'dashboard':
        title = '仪表盘 - ' + title
        break
      case 'orders':
        title = '订单管理 - ' + title
        break
      case 'products':
        title = '商品管理 - ' + title
        break
      case 'cardkeys':
        title = '卡密管理 - ' + title
        break
      case 'settings':
        title = '系统设置 - ' + title
        break
      case 'login':
        title = '登录 - ' + title
        break
    }

    document.title = title
  })
})

export default router
