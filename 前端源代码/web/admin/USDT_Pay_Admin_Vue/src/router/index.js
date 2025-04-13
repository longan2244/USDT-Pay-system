import { createRouter, createWebHashHistory } from 'vue-router'
import { nextTick } from 'vue'

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
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('../views/OrdersView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/ProductsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/cardkeys',
      name: 'cardkeys',
      component: () => import('../views/CardKeysView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
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
