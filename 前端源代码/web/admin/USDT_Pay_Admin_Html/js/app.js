// USDT收款系统 - 前端应用
new Vue({
  el: '#app',
  data: function () {
    return {
      // 页面状态
      currentPage: 'login', // 默认显示登录页面
      sidebarCollapsed: false,
      searchQuery: '',
      criticalSettingsMissing: false, // 标记关键设置是否缺失
      highlightedElements: [], // 用于高亮显示的元素
      isLoading: false, // 全局加载状态
      // 登录表单
      loginForm: {
        adminKey: ''
      },

      // 认证信息
      token: localStorage.getItem('adminToken') || '',

      // 仪表盘数据
      dashboardData: {
        summary: {},
        productSales: [],
        salesTrend: [],
        recentOrders: []
      },
      chartInitialized: false,

      // 订单数据
      orders: [],
      orderFilters: {
        status: 'all',
        productId: '',
        startDate: '',
        endDate: '',
        search: ''
      },
      orderPagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
      },

      // 商品数据
      products: [],
      productFilters: {
        status: 'all',
        minPrice: '',
        maxPrice: '',
        search: ''
      },
      productPagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
      },

      // 卡密数据
      cardKeys: [],
      cardKeyFilters: {
        status: 'all',
        productId: '',
        search: ''
      },
      cardKeyPagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
      },
      selectedCardKeys: [], // 用于批量删除卡密

      // 系统设置
      settings: {
        // 服务器配置
        port: 9998,
        jwtSecret: '',

        // 管理员配置
        adminKey: '',

        // Tron配置
        walletAddress: '',
        fullHost: '',
        privateKey: '',
        contractAddress: '',
        apiKey: '',

        // 订单配置
        pollingTime: 15,
        expirationTime: 20,
        requiredConfirmations: 19,
        checkTimeWindow: 60,
        randomDecimalMin: 0.01,
        randomDecimalMax: 0.50,
        maxPendingOrdersPerDevice: 2,
        orderCreationCooldown: 5,
        maxOrdersInCooldownPeriod: 2,

        // 数据保存配置
        dataSaveInterval: 5
      },
      originalSettings: {}, // 用于存储原始设置，以便比较是否有修改
      showPassword: false,
      showPrivateKey: false,

      // 模态框
      showModal: false,
      modalType: '',
      modalTitle: '',
      previousModalType: '',
      previousModalTitle: '',

      // 表单数据
      productForm: {
        id: null,
        name: '',
        price: '',
        description: '',
        status: 'active'
      },

      cardKeyForm: {
        productId: '',
        keys: '',
        delimiter: '#',
        useDelimiter: false,
        removeDuplicates: false
      },
      previewCardKeys: [],

      paymentForm: {
        txHash: ''
      },

      // 选中的数据
      selectedOrder: {},
      selectedProduct: {},

      // 通知
      notification: {
        show: false,
        type: 'success',
        title: '',
        message: '',
        timeout: null
      },

      // 图表实例
      salesChart: null,

      // 加载状态
      loading: {
        dashboard: false,
        orders: false,
        products: false,
        cardKeys: false,
        settings: false
      }
    };
  },

  computed: {
    // 页面标题
    pageTitle() {
      switch (this.currentPage) {
        case 'dashboard': return '仪表盘';
        case 'orders': return '订单管理';
        case 'products': return '商品管理';
        case 'cardkeys': return '卡密管理';
        case 'settings': return '系统设置';
        case 'login': return '登录';
        default: return 'USDT收款系统';
      }
    },

    // 过滤后的订单 - 直接使用从服务器获取的分页数据
    filteredOrders() {
      return this.orders;
    },

    // 过滤后的卡密 - 直接使用从服务器获取的分页数据
    filteredCardKeys() {
      return this.cardKeys;
    },

    // 活跃的商品（用于添加卡密）
    activeProducts() {
      return this.products.filter(product => product.status === 'active');
    },

    // 仪表盘是否有数据
    hasDashboardData() {
      return this.dashboardData.summary &&
        Object.keys(this.dashboardData.summary).length > 0 &&
        !this.loading.dashboard;
    },

    // 是否有商品销售数据
    hasProductSalesData() {
      return this.dashboardData.productSales &&
        this.dashboardData.productSales.length > 0;
    },

    // 是否有最近订单数据
    hasRecentOrdersData() {
      return this.dashboardData.recentOrders &&
        this.dashboardData.recentOrders.length > 0;
    },

    // 是否有销售趋势数据
    hasSalesTrendData() {
      return this.dashboardData.salesTrend &&
        this.dashboardData.salesTrend.length > 0;
    },

    // 是否有选中的卡密
    hasSelectedCardKeys() {
      return this.selectedCardKeys.length > 0;
    }
  },

  created() {
    // 添加请求拦截器
    axios.interceptors.request.use(config => {
      // 设置全局加载状态
      this.isLoading = true;
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // 添加响应拦截器
    axios.interceptors.response.use(
      response => {
        // 请求完成，关闭加载状态
        this.isLoading = false;
        return response;
      },
      error => {
        // 请求出错，也要关闭加载状态
        this.isLoading = false;

        if (error.status === 507) {
          this.showNotification('error', '错误', '未提供API密钥');
          // 跳转到设置页面
          this.currentPage = 'settings';
          this.criticalSettingsMissing = true;
          this.fetchSettings();
          return Promise.reject(error);
        }

        if (error.response && error.response.data && error.response.data.message === 'Missing critical settings') {
          this.showNotification('error', '关键设置缺失', '请设置钱包地址和API密钥');
          // 跳转到设置页面
          this.currentPage = 'settings';
          this.criticalSettingsMissing = true;
          this.fetchSettings();
          return Promise.reject(error);
        }

        if (error.response && error.response.status === 403) {
          this.logout();
          this.showNotification('error', '会话已过期', '请重新登录');
        }
        return Promise.reject(error);
      }
    );

    // 检查是否已登录
    if (this.token) {
      this.checkAuth();
    }
  },

  methods: {
    setupSwipeGesture() {
      // 只在移动端添加侧滑手势
      if (window.innerWidth <= 768) {
        document.addEventListener('touchstart', this.handleTouchStart, false);
        document.addEventListener('touchmove', this.handleTouchMove, false);
        document.addEventListener('touchend', this.handleTouchEnd, false);

        // 保存初始触摸位置
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.minSwipeDistance = 50; // 最小滑动距离
        this.maxSwipeTime = 300; // 最大滑动时间(毫秒)
        this.touchStartTime = 0;
      }
    },
    // 移除侧滑手势
    removeSwipeGesture() {
      document.removeEventListener('touchstart', this.handleTouchStart);
      document.removeEventListener('touchmove', this.handleTouchMove);
      document.removeEventListener('touchend', this.handleTouchEnd);
    },

    // 处理触摸开始
    handleTouchStart(event) {
      this.touchStartX = event.touches[0].clientX;
      this.touchStartY = event.touches[0].clientY;
      this.touchStartTime = Date.now();
    },

    // 处理触摸移动
    handleTouchMove(event) {
      // 可以在这里添加实时反馈效果
    },
    // 处理触摸结束
    handleTouchEnd(event) {
      if (!event.changedTouches || !event.changedTouches[0]) return;

      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;
      const touchEndTime = Date.now();

      // 计算水平和垂直滑动距离
      const distanceX = touchEndX - this.touchStartX;
      const distanceY = Math.abs(touchEndY - this.touchStartY);

      // 计算滑动时间
      const swipeTime = touchEndTime - this.touchStartTime;

      // 判断是否为有效的右滑手势：
      // 1. 水平滑动距离大于最小滑动距离
      // 2. 垂直滑动距离小于水平滑动距离的一半(确保是水平滑动)
      // 3. 滑动时间小于最大滑动时间
      // 4. 起始点在屏幕左侧30%区域内
      if (
        distanceX > this.minSwipeDistance &&
        distanceY < distanceX / 2 &&
        swipeTime < this.maxSwipeTime &&
        this.touchStartX < window.innerWidth * 0.3
      ) {
        // 如果侧边栏当前未显示，则显示侧边栏
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');

        if (sidebar && !sidebar.classList.contains('active')) {
          sidebar.classList.add('active');
          if (overlay) overlay.classList.add('active');
        }
      }

      // 判断是否为有效的左滑手势(关闭侧边栏)
      if (
        distanceX < -this.minSwipeDistance &&
        distanceY < Math.abs(distanceX) / 2 &&
        swipeTime < this.maxSwipeTime
      ) {
        // 如果侧边栏当前显示，则关闭侧边栏
        this.closeSidebar();
      }
    },
    async closeSidebar() {
      // 移除侧边栏的active类
      document.querySelector('.sidebar').classList.remove('active');
      // 移除遮罩层的active类
      document.querySelector('.sidebar-overlay').classList.remove('active');

      //动画完成后
      this.$nextTick(() => {
        // 返回promise
        return new Promise(resolve => {
          // 动画完成后
          setTimeout(() => {
            // 返回promise
            resolve();
          }, 300);
        });
      })

    },
    // 高亮显示元素
    highlightElements(selectors) {
      // 清除之前的高亮
      this.clearHighlights();

      // 添加高亮类
      this.$nextTick(() => {
        selectors.forEach(selector => {
          const element = document.querySelector(selector);
          if (element) {
            element.classList.add('highlight-section');
            this.highlightedElements.push(element);

            // 滚动到第一个元素
            if (selectors.indexOf(selector) === 0) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }
        });

        // 3秒后自动清除高亮
        setTimeout(() => {
          this.clearHighlights();
        }, 3000);
      });
    },

    // 清除高亮
    clearHighlights() {
      this.highlightedElements.forEach(element => {
        element.classList.remove('highlight-section');
      });
      this.highlightedElements = [];
    },

    // 认证相关方法
    async checkAuth() {
      try {
        // 首先获取系统设置，检查关键设置是否已配置
        await this.fetchSettings();

        // 如果关键设置缺失，强制跳转到设置页面
        if (this.criticalSettingsMissing) {
          this.currentPage = 'settings';
          this.showNotification('warning', '系统配置不完整', '请先完成钱包地址和API密钥的配置', 10000);
        } else {
          // 关键设置已配置，正常跳转到仪表盘
          this.currentPage = 'dashboard';
          this.fetchDashboardData();
        }
      } catch (error) {
        console.error('认证失败:', error);
        this.logout();
      }
    },

    async login() {
      if (!this.loginForm.adminKey) {
        this.showNotification('error', '登录失败', '请输入管理员密钥');
        return;
      }

      try {
        const response = await axios.post('/api/admin/login', {
          adminKey: this.loginForm.adminKey
        });

        if (response.data.success) {
          this.token = response.data.data.token;
          localStorage.setItem('adminToken', this.token);
          this.currentPage = 'dashboard';
          this.fetchDashboardData();
          this.showNotification('success', '登录成功', '欢迎使用USDT收款系统');

          this.fetchSettings();
        }
      } catch (error) {
        console.error('登录失败:', error);
        this.showNotification('error', '登录失败', error.response?.data?.message || '管理员密钥错误');
      }
    },

    logout() {
      this.token = '';
      localStorage.removeItem('adminToken');
      this.currentPage = 'login';
    },

    // 页面导航
    async changePage(page) {
      // 如果关键设置缺失且尝试访问非设置页面，阻止导航并显示提示
      if (this.criticalSettingsMissing && page !== 'settings') {
        this.showNotification('warning', '系统配置不完整', '请先完成钱包地址和API密钥的配置', 5000);
        return;
      }


      // 在移动端视图下，切换页面时关闭侧边栏
      if (window.innerWidth <= 768) {
        await this.closeSidebar();
      }


      this.currentPage = page;
      // 根据页面加载相应数据
      switch (page) {
        case 'dashboard':
          this.fetchDashboardData();
          break;
        case 'orders':
          // 加载订单页面时，同时加载商品列表以确保过滤选项可用
          this.fetchOrders();
          this.fetchProducts();
          break;
        case 'products':
          this.fetchProducts();
          break;
        case 'cardkeys':
          // 加载卡密页面时，同时加载商品列表以确保过滤选项可用
          this.fetchCardKeys();
          this.fetchProducts();
          break;
        case 'settings':
          // 加载设置页面时，获取系统设置
          this.fetchSettings();
          break;
      }
    },

    // 侧边栏折叠
    toggleSidebar() {
      if (window.innerWidth <= 768) {
        this.closeSidebar();
        return
      }
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

    // 移动端菜单切换
    toggleMobileMenu() {
      const sidebar = document.querySelector('.sidebar');
      const overlay = document.querySelector('.sidebar-overlay');

      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
      // this.$nextTick(() => {
      //   const sidebar = document.querySelector('.sidebar');
      //   if (sidebar) {
      //     sidebar.classList.toggle('active');
      //   }
      // });
    },

    // 仪表盘数据
    async fetchDashboardData() {
      this.loading.dashboard = true;
      try {
        const response = await axios.get('/api/admin/dashboard');
        if (response.data.success) {
          // 按可用卡密数量排序
          if (response.data.data.productSales) {
            response.data.data.productSales.sort((a, b) => a.availableCount - b.availableCount);
          }

          this.dashboardData = response.data.data;

          // 确保在数据加载后初始化图表
          this.$nextTick(() => {
            this.initSalesChart();
          });
        } else {
          console.error('获取仪表盘数据失败: 服务器返回错误');
          this.showNotification('error', '获取数据失败', '服务器返回错误');
        }
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
        this.showNotification('error', '获取数据失败', error.response?.data?.message || '网络错误');
      } finally {
        this.loading.dashboard = false;
      }
    },

    refreshDashboard() {
      this.fetchDashboardData();
      this.showNotification('info', '刷新成功', '仪表盘数据已更新');
    },

    // 初始化销售趋势图表
    initSalesChart() {
      if (!this.hasSalesTrendData) return;

      // 获取图表容器
      const chartElement = this.$refs.salesChart;
      if (!chartElement) return;

      // 销毁旧图表实例
      if (this.salesChart) {
        this.salesChart.destroy();
      }

      const salesData = this.dashboardData.salesTrend || [];

      this.salesChart = new Chart(chartElement, {
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

      this.chartInitialized = true;
    },

    // 订单相关方法
    async fetchOrders() {
      this.loading.orders = true;
      try {
        // 构建查询参数
        const params = {
          page: this.orderPagination.page,
          pageSize: this.orderPagination.pageSize
        };

        // 只添加非空的过滤条件
        if (this.orderFilters.status && this.orderFilters.status !== 'all') {
          params.status = this.orderFilters.status;
        }

        if (this.orderFilters.productId) {
          params.productId = this.orderFilters.productId;
        }

        if (this.orderFilters.startDate) {
          params.startDate = this.orderFilters.startDate;
        }

        if (this.orderFilters.endDate) {
          params.endDate = this.orderFilters.endDate;
        }

        if (this.orderFilters.search) {
          params.search = this.orderFilters.search;
        }

        // 获取订单数据
        const response = await axios.get('/api/admin/orders', { params });

        if (response.data.success) {
          this.orders = response.data.data;

          // 更新分页信息
          if (response.data.pagination) {
            this.orderPagination = {
              ...this.orderPagination,
              ...response.data.pagination
            };
          }
        } else {
          console.error('获取订单列表失败: 服务器返回错误');
          this.showNotification('error', '获取数据失败', '服务器返回错误');
        }
      } catch (error) {
        console.error('获取订单列表失败:', error);
        this.showNotification('error', '获取数据失败', '无法加载订单列表');
      } finally {
        this.loading.orders = false;
      }
    },

    refreshOrders() {
      // 重置到第一页
      this.orderPagination.page = 1;
      this.fetchOrders();
      this.showNotification('info', '刷新成功', '订单列表已更新');
    },

    // 应用订单过滤条件
    applyOrderFilters() {
      this.orderPagination.page = 1; // 重置到第一页
      this.fetchOrders();
    },

    // 重置订单过滤条件
    resetOrderFilters() {
      this.orderFilters = {
        status: 'all',
        productId: '',
        startDate: '',
        endDate: '',
        search: ''
      };
      this.orderPagination.page = 1;
      this.fetchOrders();
    },

    // 订单分页方法
    goToOrderPage(page) {
      if (page >= 1 && page <= this.orderPagination.totalPages) {
        this.orderPagination.page = page;
        this.fetchOrders();
      }
    },

    viewOrderDetails(order) {
      this.selectedOrder = order;
      this.modalType = 'orderDetails';
      this.modalTitle = '订单详情';
      this.showModal = true;
    },

    confirmOrderPayment(order) {
      this.selectedOrder = order;
      this.modalType = 'confirmPayment';
      this.modalTitle = '确认支付';
      this.paymentForm.txHash = '';
      this.showModal = true;
    },

    async submitConfirmPayment() {
      if (!this.paymentForm.txHash) {
        this.showNotification('error', '确认失败', '请输入交易哈希');
        return;
      }

      try {
        const response = await axios.post('/api/admin/confirm-payment', {
          orderId: this.selectedOrder.id,
          txHash: this.paymentForm.txHash
        });

        if (response.data.success) {
          this.showNotification('success', '确认成功', '订单已完成支付');
          this.closeModal();
          this.fetchOrders();

          // 如果在仪表盘页面，也更新仪表盘数据
          if (this.currentPage === 'dashboard') {
            this.fetchDashboardData();
          }
        }
      } catch (error) {
        console.error('确认支付失败:', error);
        this.showNotification('error', '确认失败', error.response?.data?.message || '无法确认支付');
      }
    },

    // 商品相关方法
    async fetchProducts() {
      this.loading.products = true;
      try {
        // 构建查询参数
        const params = {
          page: this.productPagination.page,
          pageSize: this.productPagination.pageSize
        };

        // 只添加非空的过滤条件
        if (this.productFilters.status && this.productFilters.status !== 'all') {
          params.status = this.productFilters.status;
        }

        if (this.productFilters.minPrice) {
          params.minPrice = this.productFilters.minPrice;
        }

        if (this.productFilters.maxPrice) {
          params.maxPrice = this.productFilters.maxPrice;
        }

        if (this.productFilters.search) {
          params.search = this.productFilters.search;
        }

        // 获取商品数据
        const response = await axios.get('/api/admin/products', { params });

        if (response.data.success) {
          this.products = response.data.data;

          // 更新分页信息
          if (response.data.pagination) {
            this.productPagination = {
              ...this.productPagination,
              ...response.data.pagination
            };
          }
        }
      } catch (error) {
        console.error('获取商品列表失败:', error);
        this.showNotification('error', '获取数据失败', '无法加载商品列表');
      } finally {
        this.loading.products = false;
      }
    },

    refreshProducts() {
      // 重置到第一页
      this.productPagination.page = 1;
      this.fetchProducts();
      this.showNotification('info', '刷新成功', '商品列表已更新');
    },

    // 应用商品过滤条件
    applyProductFilters() {
      this.productPagination.page = 1; // 重置到第一页
      this.fetchProducts();
    },

    // 重置商品过滤条件
    resetProductFilters() {
      this.productFilters = {
        status: 'all',
        minPrice: '',
        maxPrice: '',
        search: ''
      };
      this.productPagination.page = 1;
      this.fetchProducts();
    },

    // 商品分页方法
    goToProductPage(page) {
      if (page >= 1 && page <= this.productPagination.totalPages) {
        this.productPagination.page = page;
        this.fetchProducts();
      }
    },

    showAddProductModal() {
      this.productForm = {
        id: null,
        name: '',
        price: '',
        description: '',
        status: 'active'
      };
      this.modalType = 'addProduct';
      this.modalTitle = '添加商品';
      this.showModal = true;
    },

    editProduct(product) {
      this.productForm = { ...product };
      this.modalType = 'editProduct';
      this.modalTitle = '编辑商品';
      this.showModal = true;
    },

    async toggleProductStatus(product) {
      const newStatus = product.status === 'active' ? 'deleted' : 'active';
      try {
        const response = await axios.put(`/api/admin/products/${product.id}`, {
          status: newStatus
        });

        if (response.data.success) {
          this.showNotification('success', '状态更新成功', `商品已${newStatus === 'active' ? '上架' : '下架'}`);
          this.fetchProducts();
        }
      } catch (error) {
        console.error('更新商品状态失败:', error);
        this.showNotification('error', '更新失败', '无法更新商品状态');
      }
    },

    async submitProduct() {
      if (!this.productForm.name || !this.productForm.price) {
        this.showNotification('error', '提交失败', '请填写商品名称和价格');
        return;
      }

      try {
        let response;

        if (this.modalType === 'addProduct') {
          // 添加商品
          response = await axios.post('/api/admin/products', {
            name: this.productForm.name,
            price: parseFloat(this.productForm.price),
            description: this.productForm.description
          });

          if (response.data.success) {
            this.showNotification('success', '添加成功', '商品已添加');
          }
        } else {
          // 编辑商品
          response = await axios.put(`/api/admin/products/${this.productForm.id}`, {
            name: this.productForm.name,
            price: parseFloat(this.productForm.price),
            description: this.productForm.description,
            status: this.productForm.status
          });

          if (response.data.success) {
            this.showNotification('success', '更新成功', '商品信息已更新');
          }
        }

        this.closeModal();
        this.fetchProducts();

        // 如果在仪表盘页面，也更新仪表盘数据
        if (this.currentPage === 'dashboard') {
          this.fetchDashboardData();
        }
      } catch (error) {
        console.error('提交商品失败:', error);
        this.showNotification('error', '提交失败', error.response?.data?.message || '无法提交商品信息');
      }
    },

    addCardKeys(product) {
      this.selectedProduct = product;
      this.cardKeyForm = {
        productId: product.id,
        keys: '',
        delimiter: '#',
        useDelimiter: false,
        removeDuplicates: false
      };
      this.modalType = 'addCardKey';
      this.modalTitle = `添加卡密 - ${product.name}`;
      this.showModal = true;
    },

    // 预览卡密分割结果
    previewCardKeysSplit() {
      if (!this.cardKeyForm.keys.trim()) {
        this.showNotification('warning', '预览失败', '请输入卡密内容');
        return;
      }

      // 根据分隔方式分割卡密
      let keyArray = [];
      if (this.cardKeyForm.useDelimiter) {
        // 使用自定义分隔符
        const delimiter = this.cardKeyForm.delimiter || '#';
        keyArray = this.cardKeyForm.keys.split(delimiter);
      } else {
        // 使用换行符
        keyArray = this.cardKeyForm.keys.split('\n');
      }

      // 过滤空字符串并去除前后空格
      keyArray = keyArray.map(key => key.trim()).filter(key => key);

      // 如果需要去重
      if (this.cardKeyForm.removeDuplicates) {
        keyArray = [...new Set(keyArray)];
      }

      this.previewCardKeys = keyArray;

      // 保存当前的表单状态，以便返回时恢复
      this.previousModalType = this.modalType;
      this.previousModalTitle = this.modalTitle;

      // 切换到预览模式
      this.modalType = 'previewCardKeys';
      this.modalTitle = '卡密预览';
    },

    // 卡密相关方法
    async fetchCardKeys() {
      this.loading.cardKeys = true;
      try {
        // 构建查询参数
        const params = {
          page: this.cardKeyPagination.page,
          pageSize: this.cardKeyPagination.pageSize
        };

        // 只添加非空的过滤条件
        if (this.cardKeyFilters.status && this.cardKeyFilters.status !== 'all') {
          params.status = this.cardKeyFilters.status;
        }

        if (this.cardKeyFilters.productId) {
          params.productId = this.cardKeyFilters.productId;
        }

        if (this.cardKeyFilters.search) {
          params.search = this.cardKeyFilters.search;
        }

        // 获取卡密数据
        const response = await axios.get('/api/admin/card-keys', { params });

        if (response.data.success) {
          this.cardKeys = response.data.data;

          // 更新分页信息
          if (response.data.pagination) {
            this.cardKeyPagination = {
              ...this.cardKeyPagination,
              ...response.data.pagination
            };
          }
        }
      } catch (error) {
        console.error('获取卡密列表失败:', error);
        this.showNotification('error', '获取数据失败', '无法加载卡密列表');
      } finally {
        this.loading.cardKeys = false;
      }
    },

    refreshCardKeys() {
      // 重置到第一页
      this.cardKeyPagination.page = 1;
      this.fetchCardKeys();
      this.showNotification('info', '刷新成功', '卡密列表已更新');
    },

    // 应用卡密过滤条件
    applyCardKeyFilters() {
      this.cardKeyPagination.page = 1; // 重置到第一页
      this.fetchCardKeys();
    },

    // 重置卡密过滤条件
    resetCardKeyFilters() {
      this.cardKeyFilters = {
        status: 'all',
        productId: '',
        search: ''
      };
      this.cardKeyPagination.page = 1;
      this.fetchCardKeys();
    },

    // 卡密分页方法
    goToCardKeyPage(page) {
      if (page >= 1 && page <= this.cardKeyPagination.totalPages) {
        this.cardKeyPagination.page = page;
        this.fetchCardKeys();
      }
    },

    showAddCardKeyModal() {
      if (this.activeProducts.length === 0) {
        this.showNotification('warning', '无法添加', '没有可用的商品，请先添加商品');
        return;
      }

      this.cardKeyForm = {
        productId: this.activeProducts[0].id,
        keys: '',
        delimiter: '#',
        useDelimiter: false,
        removeDuplicates: false
      };
      this.previewCardKeys = [];
      this.modalType = 'addCardKey';
      this.modalTitle = '添加卡密';
      this.showModal = true;
    },

    async submitCardKeys() {
      if (!this.cardKeyForm.productId || !this.cardKeyForm.keys.trim()) {
        this.showNotification('error', '提交失败', '请选择商品并输入卡密');
        return;
      }

      try {
        // 准备请求参数
        const requestData = {
          productId: this.cardKeyForm.productId,
          keys: this.cardKeyForm.keys,
          removeDuplicates: this.cardKeyForm.removeDuplicates
        };

        // 如果使用自定义分隔符，添加到请求中
        if (this.cardKeyForm.useDelimiter && this.cardKeyForm.delimiter) {
          requestData.delimiter = this.cardKeyForm.delimiter;
        }

        // 发送批量添加卡密请求
        const response = await axios.post('/api/admin/add-card-key', requestData);

        if (response.data.success) {
          const count = response.data.data.count || 0;
          this.showNotification('success', '添加成功', `成功添加 ${count} 个卡密`);
          this.closeModal();
          this.fetchCardKeys();

          // 如果在仪表盘页面或商品页面，也更新相关数据
          if (this.currentPage === 'dashboard') {
            this.fetchDashboardData();
          } else if (this.currentPage === 'products') {
            this.fetchProducts();
          }
        }
      } catch (error) {
        console.error('添加卡密失败:', error);
        this.showNotification('error', '添加失败', error.response?.data?.message || '无法添加卡密');
      }
    },

    // 选择/取消选择卡密
    toggleSelectCardKey(cardKey) {
      const index = this.selectedCardKeys.findIndex(item => item.id === cardKey.id);
      if (index === -1) {
        this.selectedCardKeys.push(cardKey);
      } else {
        this.selectedCardKeys.splice(index, 1);
      }
    },

    // 检查卡密是否被选中
    isCardKeySelected(cardKey) {
      return this.selectedCardKeys.some(item => item.id === cardKey.id);
    },

    // 全选/取消全选卡密
    toggleSelectAllCardKeys() {
      if (this.selectedCardKeys.length === this.cardKeys.length) {
        // 如果已经全选，则取消全选
        this.selectedCardKeys = [];
      } else {
        // 否则全选
        this.selectedCardKeys = [...this.cardKeys];
      }
    },

    // 删除卡密
    async deleteCardKey(cardKey) {
      try {
        const response = await axios.delete(`/api/admin/card-keys/${cardKey.id}`);

        if (response.data.success) {
          this.showNotification('success', '删除成功', '卡密已删除');
          // 如果被删除的卡密在选中列表中，也从选中列表中移除
          const index = this.selectedCardKeys.findIndex(item => item.id === cardKey.id);
          if (index !== -1) {
            this.selectedCardKeys.splice(index, 1);
          }
          this.fetchCardKeys();

          // 如果在仪表盘页面或商品页面，也更新相关数据
          if (this.currentPage === 'dashboard') {
            this.fetchDashboardData();
          } else if (this.currentPage === 'products') {
            this.fetchProducts();
          }
        }
      } catch (error) {
        console.error('删除卡密失败:', error);
        this.showNotification('error', '删除失败', error.response?.data?.message || '无法删除卡密');
      }
    },

    // 批量删除卡密
    async batchDeleteCardKeys() {
      if (this.selectedCardKeys.length === 0) {
        this.showNotification('warning', '请选择卡密', '请先选择要删除的卡密');
        return;
      }

      try {
        const cardKeyIds = this.selectedCardKeys.map(cardKey => cardKey.id);
        const response = await axios.post('/api/admin/card-keys/batch-delete', {
          ids: cardKeyIds
        });

        if (response.data.success) {
          const count = response.data.data.count || 0;
          this.showNotification('success', '批量删除成功', `成功删除 ${count} 个卡密`);
          this.selectedCardKeys = []; // 清空选中列表
          this.fetchCardKeys();

          // 如果在仪表盘页面或商品页面，也更新相关数据
          if (this.currentPage === 'dashboard') {
            this.fetchDashboardData();
          } else if (this.currentPage === 'products') {
            this.fetchProducts();
          }
        }
      } catch (error) {
        console.error('批量删除卡密失败:', error);
        this.showNotification('error', '删除失败', error.response?.data?.message || '无法删除卡密');
      }
    },

    // 设置相关方法
    async fetchSettings() {
      this.loading.settings = true;
      try {
        const response = await axios.get('/api/admin/settings');

        if (response.data.success) {
          this.settings = response.data.data;
          // 保存原始设置，用于比较是否有修改
          this.originalSettings = JSON.parse(JSON.stringify(response.data.data));

          // 检查关键设置是否为空
          const settingsMissing = !this.settings.walletAddress || !this.settings.apiKey;

          // 更新关键设置状态
          if (this.criticalSettingsMissing !== settingsMissing) {
            this.criticalSettingsMissing = settingsMissing;
          }

          if (settingsMissing) {
            this.currentPage = 'settings';
            this.showNotification('warning', '关键设置缺失',
              '请设置钱包地址和API密钥，否则系统将无法正常运行', 10000);

            // 自动高亮关键设置字段
            this.$nextTick(() => {
              this.highlightElements(['.usdtinput', '.apikeyinput']);
            });
          }
        } else {
          console.error('获取系统设置失败: 服务器返回错误');
          this.showNotification('error', '获取设置失败', '服务器返回错误');
        }
      } catch (error) {
        console.error('获取系统设置失败:', error);
        this.showNotification('error', '获取设置失败', '无法加载系统设置');
      } finally {
        this.loading.settings = false;
      }
    },

    saveSettings() {
      if (!this.settings.walletAddress || !this.settings.apiKey) {
        this.showNotification('error', '保存失败', '请设置钱包地址和API密钥');
        this.$nextTick(() => {
          this.highlightElements(['.usdtinput', '.apikeyinput']);
        });
        return;
      }

      // 显示确认对话框
      this.modalType = 'confirmSettings';
      this.modalTitle = '确认修改系统设置';
      this.showModal = true;
    },

    async submitSettingsChanges() {
      try {
        // 发送更新请求
        const response = await axios.put('/api/admin/settings', this.settings);

        if (response.data.success) {
          this.settings = response.data.data;

          // 检查关键设置是否已填写
          const wasMissing = this.criticalSettingsMissing;
          this.criticalSettingsMissing = !this.settings.walletAddress || !this.settings.apiKey;

          // 如果之前缺失但现在已填写，显示特殊通知
          if (wasMissing && !this.criticalSettingsMissing) {
            this.showNotification('success', '关键设置已配置', '系统现在可以完全运行，所有功能已启用', 5000);
          } else {
            this.showNotification('success', '保存成功', '系统设置已更新');
          }

          this.closeModal();
        } else {
          console.error('保存系统设置失败: 服务器返回错误');
          this.showNotification('error', '保存失败', '服务器返回错误');
        }
      } catch (error) {
        console.error('保存系统设置失败:', error);
        this.showNotification('error', '保存失败', error.response?.data?.message || '无法保存设置');
      }
    },

    resetSettings() {
      // 恢复上一次的设置
      axios.post('/api/admin/settings/restore-previous')
        .then(response => {
          if (response.data.success) {
            this.settings = response.data.data;
            this.originalSettings = JSON.parse(JSON.stringify(response.data.data));
            this.showNotification('success', '恢复成功', '已恢复到上一次的设置');
          } else {
            this.showNotification('error', '恢复失败', '服务器返回错误');
          }
        })
        .catch(error => {
          console.error('恢复上一次设置失败:', error);
          this.showNotification('error', '恢复失败', '无法恢复到上一次的设置');
        });
    },

    // 模态框相关方法
    closeModal() {
      // 如果当前是预览模式，返回到添加卡密表单
      if (this.modalType === 'previewCardKeys' && this.previousModalType) {
        this.modalType = this.previousModalType;
        this.modalTitle = this.previousModalTitle;
      } else {
        this.showModal = false;
      }
    },

    submitModal() {
      switch (this.modalType) {
        case 'addProduct':
        case 'editProduct':
          this.submitProduct();
          break;
        case 'addCardKey':
          this.submitCardKeys();
          break;
        case 'previewCardKeys':
          // 返回到添加卡密表单，恢复之前保存的状态
          this.modalType = this.previousModalType || 'addCardKey';
          this.modalTitle = this.previousModalTitle || (this.selectedProduct ?
            `添加卡密 - ${this.selectedProduct.name}` :
            '添加卡密');
          break;
        case 'confirmPayment':
          this.submitConfirmPayment();
          break;
        case 'confirmSettings':
          this.submitSettingsChanges();
          break;
        default:
          this.closeModal();
      }
    },

    // 通知相关方法
    showNotification(type, title, message, duration = 3000) {
      // 清除之前的定时器
      if (this.notification.timeout) {
        clearTimeout(this.notification.timeout);
      }

      // 设置通知内容
      this.notification.type = type;
      this.notification.title = title;
      this.notification.message = message;
      this.notification.show = true;

      // 设置自动关闭
      this.notification.timeout = setTimeout(() => {
        this.closeNotification();
      }, duration);
    },

    closeNotification() {
      this.notification.show = false;
    },

    getNotificationIcon() {
      switch (this.notification.type) {
        case 'success': return 'ri-check-line';
        case 'error': return 'ri-error-warning-line';
        case 'warning': return 'ri-alert-line';
        case 'info': return 'ri-information-line';
        default: return 'ri-notification-line';
      }
    },

    // 辅助方法
    formatDate(timestamp) {
      if (!timestamp) return '-';
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    getStatusText(status) {
      switch (status) {
        case 'pending': return '待支付';
        case 'processing': return '处理中';
        case 'completed': return '已完成';
        case 'expired': return '已取消';
        default: return status;
      }
    },

    getStatusClass(status) {
      switch (status) {
        case 'pending': return 'status-warning';
        case 'processing': return 'status-info';
        case 'completed': return 'status-success';
        case 'expired': return 'status-danger';
        case 'active': return 'status-success';
        case 'deleted': return 'status-danger';
        default: return '';
      }
    },

    calculateProgress(sold, total) {
      if (!total) return 0;
      const percentage = (sold / total) * 100;
      return Math.round(percentage);
    },

    // 格式化订单商品信息
    formatOrderProducts(order) {
      // 如果是单商品订单
      if (order.productName) {
        return order.productName;
      }

      // 如果是多商品订单
      if (order.items && order.items.length > 0) {
        // 提取所有商品名称
        const productNames = order.items.map(item => {
          if (item.quantity > 1) {
            return `${item.productName} x${item.quantity}`;
          }
          return item.productName;
        });

        // 如果商品数量超过2个，只显示前2个并加上"等"
        if (productNames.length > 2) {
          return productNames.slice(0, 2).join(', ') + ' 等';
        }

        // 否则显示所有商品，用逗号分隔
        return productNames.join(', ');
      }

      // 如果没有商品信息，返回默认文本
      return '未知商品';
    }
  },

  mounted() {
    if (this.token) {
      this.checkAuth();
    }
    // 添加侧滑手势支持
    this.setupSwipeGesture();
  },
  beforeDestroy() {
    // 移除侧滑手势监听器
    this.removeSwipeGesture();
  },

  watch: {
    // 监听仪表盘数据变化，更新图表
    'dashboardData.salesTrend': function () {
      if (this.hasSalesTrendData && this.currentPage === 'dashboard') {
        this.$nextTick(() => {
          this.initSalesChart();
        });
      }
    }
  }
});
