// USDT支付系统 - 用户端应用
new Vue({
  el: '#app',
  data: {
    // 页面状态
    currentPage: 'products', // products, product-detail, cart, order-confirm, order-complete, orders, order-detail, card-keys
    previousPage: null,
    
    // 主题设置
    isDarkTheme: true,
    
    // 商品数据
    products: [],
    selectedProduct: null,
    searchQuery: '',
    
    // 购物车数据
    cart: [],
    
    // 订单数据
    currentOrder: null,
    selectedOrder: null,
    myOrders: [],
    orderExpiration: null,
    expirationInterval: null,
    
    // 卡密数据
    myCardKeys: [],
    
    // 用户输入
    contactInfo: '',
    searchContactInfo: '',
    quantity: 1,
    
    // 设备标识
    deviceUuid: '',
    
    // 通知组件
    notification: {
      show: false,
      type: 'info', // success, error, warning, info
      title: '',
      message: '',
      timeout: null
    }
  },
  
  computed: {
    // 过滤后的商品列表
    filteredProducts() {
      if (!this.searchQuery) {
        return this.products;
      }
      
      const query = this.searchQuery.toLowerCase();
      return this.products.filter(product => 
        product.name.toLowerCase().includes(query) || 
        (product.description && product.description.toLowerCase().includes(query))
      );
    },
    
    // 购物车总价
    cartTotal() {
      return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
    },
    
    // 购物车商品总数
    cartItemsCount() {
      return this.cart.reduce((count, item) => count + item.quantity, 0);
    }
  },
  
  created() {
    // 初始化设备UUID
    this.initDeviceUuid();
    
    // 加载商品列表
    this.loadProducts();
    
    // 从本地存储加载联系方式
    this.loadContactInfo();
    
    // 从本地存储加载购物车
    this.loadCart();
    
    // 检查URL参数，处理外部链接跳转
    this.handleUrlParams();
    
    // 初始化主题
    this.initTheme();
  },
  
  methods: {
    // 初始化设备UUID
    initDeviceUuid() {
      // 从本地存储获取设备UUID
      let uuid = localStorage.getItem('deviceUuid');
      
      // 如果不存在，则生成一个新的UUID
      if (!uuid) {
        uuid = this.generateUuid();
        localStorage.setItem('deviceUuid', uuid);
      }
      
      this.deviceUuid = uuid;
    },
    
    // 初始化主题
    initTheme() {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light') {
        this.isDarkTheme = false;
        document.body.classList.add('light-theme');
      }
    },
    
    // 生成UUID
    generateUuid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    
    // 加载商品列表
    async loadProducts() {
      try {
        const response = await axios.get('/api/products');
        
        if (response.data.success) {
          this.products = response.data.data.filter(product => product.status === 'active');
        } else {
          this.showNotification('error', '加载失败', response.data.message || '无法加载商品列表');
        }
      } catch (error) {
        console.error('加载商品列表失败:', error);
        this.showNotification('error', '加载失败', '网络错误，请稍后再试');
      }
    },
    
    // 查看商品详情
    viewProduct(product) {
      this.selectedProduct = product;
      this.previousPage = this.currentPage;
      this.currentPage = 'product-detail';
      this.quantity = 1; // 重置数量为1
    },
    
    // 增加购买数量
    increaseQuantity() {
      if (this.quantity < this.selectedProduct.availableCount) {
        this.quantity++;
      }
    },
    
    // 减少购买数量
    decreaseQuantity() {
      if (this.quantity > 1) {
        this.quantity--;
      }
    },
    
    // 添加商品到购物车
    addToCart(product, quantity) {
      // 检查购物车中是否已有该商品
      const existingItem = this.cart.find(item => item.productId === product.id);
      
      if (existingItem) {
        // 如果已存在，更新数量（不超过库存）
        const newQuantity = existingItem.quantity + quantity;
        existingItem.quantity = Math.min(newQuantity, product.availableCount);
      } else {
        // 如果不存在，添加新项目
        this.cart.push({
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: quantity,
          availableCount: product.availableCount
        });
      }
      
      // 显示通知
      this.showNotification('success', '已添加到购物车', `${product.name} x ${quantity}`);
      
      // 保存购物车到本地存储
      this.saveCart();
    },
    
    // 从商品详情页添加到购物车
    addToCartFromDetail() {
      if (this.selectedProduct && this.quantity > 0) {
        this.addToCart(this.selectedProduct, this.quantity);
        this.goToCartPage();
      }
    },
    
    // 从商品列表添加到购物车
    addToCartFromList(product, event) {
      // 阻止事件冒泡，避免触发viewProduct
      if (event) {
        event.stopPropagation();
      }
      
      // 默认添加1个
      this.addToCart(product, 1);
    },
    
    // 更新购物车中商品数量
    updateCartItemQuantity(index, change) {
      const item = this.cart[index];
      const newQuantity = item.quantity + change;
      
      // 确保数量在有效范围内
      if (newQuantity > 0 && newQuantity <= item.availableCount) {
        item.quantity = newQuantity;
        this.saveCart();
      }
    },
    
    // 从购物车中移除商品
    removeFromCart(index) {
      this.cart.splice(index, 1);
      this.saveCart();
    },
    
    // 清空购物车
    clearCart() {
      this.cart = [];
      this.saveCart();
    },
    
    // 保存购物车到本地存储
    saveCart() {
      localStorage.setItem('cart', JSON.stringify(this.cart));
    },
    
    // 从本地存储加载购物车
    loadCart() {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          this.cart = JSON.parse(savedCart);
        } catch (e) {
          console.error('购物车数据解析失败:', e);
          this.cart = [];
        }
      }
    },
    
    // 前往购物车页面
    goToCartPage() {
      this.previousPage = this.currentPage;
      this.currentPage = 'cart';
    },
    
    // 创建订单
    async createOrder() {
      if (!this.contactInfo) {
        this.showNotification('warning', '请填写联系方式', '联系方式用于查询订单和卡密');
        return;
      }
      
      if (this.cart.length === 0 && !this.selectedProduct) {
        this.showNotification('warning', '购物车为空', '请先添加商品到购物车');
        return;
      }
      
      try {
        // 保存联系方式到本地存储
        localStorage.setItem('contactInfo', this.contactInfo);
        
        let response;
        
        // 根据是从购物车还是从商品详情页创建订单
        if (this.currentPage === 'cart') {
          // 从购物车创建多商品订单
          const items = this.cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }));
          
          response = await axios.post('/api/create-payment', {
            deviceUuid: this.deviceUuid,
            items: items,
            contactInfo: this.contactInfo
          });
        } else {
          // 从商品详情页创建单商品订单
          response = await axios.post('/api/create-payment', {
            deviceUuid: this.deviceUuid,
            productId: this.selectedProduct.id,
            contactInfo: this.contactInfo,
            quantity: this.quantity
          });
        }
        
        if (response.data.success) {
          this.currentOrder = response.data.data;
          this.previousPage = this.currentPage;
          this.currentPage = 'order-confirm';
          
          // 如果是从购物车创建的订单，清空购物车
          if (this.previousPage === 'cart') {
            this.clearCart();
          }
          
          // 生成支付二维码
          this.generateQrCode();
          
          // 设置订单过期倒计时
          this.setExpirationTimer();
          
          // 开始轮询订单状态
          this.startOrderStatusPolling();
        } else {
          this.showNotification('error', '创建订单失败', response.data.message || '无法创建订单');
        }
      } catch (error) {
        console.error('创建订单失败:', error);
        this.showNotification('error', '创建订单失败', error.response?.data?.message || '网络错误，请稍后再试');
      }
    },
    
    // 生成支付二维码
    generateQrCode() {
      if (!this.currentOrder) return;
      
      // 清除之前的二维码
      const qrcodeElement = document.getElementById('qrcode');
      if (qrcodeElement) {
        qrcodeElement.innerHTML = '';
        
        // 构建USDT-TRC20支付信息
        const qrData = `tron:${this.currentOrder.paymentAddress}?amount=${this.currentOrder.amount}&token=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`;
        
        // 生成二维码
        new QRCode(qrcodeElement, {
          text: qrData,
          width: 200,
          height: 200,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
      }
    },
    
    // 设置订单过期倒计时
    setExpirationTimer() {
      if (!this.currentOrder || !this.currentOrder.expiresAt) return;
      
      // 清除之前的计时器
      if (this.expirationInterval) {
        clearInterval(this.expirationInterval);
      }
      
      const updateExpiration = () => {
        const now = Date.now();
        const expiresAt = new Date(this.currentOrder.expiresAt).getTime();
        const timeLeft = expiresAt - now;
        
        if (timeLeft <= 0) {
          clearInterval(this.expirationInterval);
          this.orderExpiration = '已过期';
          this.checkOrderStatus(); // 检查一次订单状态
          return;
        }
        
        // 计算剩余时间
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        this.orderExpiration = `${minutes}分${seconds}秒`;
      };
      
      // 立即更新一次
      updateExpiration();
      
      // 设置定时更新
      this.expirationInterval = setInterval(updateExpiration, 1000);
    },
    
    // 开始轮询订单状态
    startOrderStatusPolling() {
      if (!this.currentOrder) return;
      
      // 每10秒检查一次订单状态
      const pollInterval = setInterval(async () => {
        // 如果不在订单确认页面，停止轮询
        if (this.currentPage !== 'order-confirm') {
          clearInterval(pollInterval);
          return;
        }
        
        await this.checkOrderStatus();
        
        // 如果订单已完成，停止轮询
        if (this.currentOrder.status === 'completed') {
          clearInterval(pollInterval);
          this.currentPage = 'order-complete';
        }
      }, 10000);
    },
    
    // 检查订单状态
    async checkOrderStatus() {
      if (!this.currentOrder) return;
      
      try {
        const response = await axios.get(`/api/check-payment/${this.deviceUuid}/${this.currentOrder.orderId}`);
        
        if (response.data.success) {
          // 更新订单状态
          this.currentOrder = {
            ...this.currentOrder,
            ...response.data.data
          };
          
          // 如果订单已完成，显示成功通知
          if (this.currentOrder.status === 'completed' && this.currentPage === 'order-confirm') {
            this.showNotification('success', '支付成功', '您的订单已完成');
            this.currentPage = 'order-complete';
            
            // 清除过期计时器
            if (this.expirationInterval) {
              clearInterval(this.expirationInterval);
            }
          }
        } else {
          this.showNotification('error', '查询失败', response.data.message || '无法查询订单状态');
        }
      } catch (error) {
        console.error('查询订单状态失败:', error);
        this.showNotification('error', '查询失败', '网络错误，请稍后再试');
      }
    },
    
    // 查询我的订单
    async searchOrders() {
      if (!this.searchContactInfo) {
        this.showNotification('warning', '请填写联系方式', '请输入下单时使用的联系方式');
        return;
      }
      
      try {
        const response = await axios.get(`/api/orders-by-contact/${encodeURIComponent(this.searchContactInfo)}`);
        
        if (response.data.success) {
          this.myOrders = response.data.data;
          
          if (this.myOrders.length === 0) {
            this.showNotification('info', '没有找到订单', '使用该联系方式没有找到订单');
          }
        } else {
          this.showNotification('error', '查询失败', response.data.message || '无法查询订单');
        }
      } catch (error) {
        console.error('查询订单失败:', error);
        this.showNotification('error', '查询失败', '网络错误，请稍后再试');
      }
    },
    
    // 查询我的卡密
    async searchCardKeys() {
      if (!this.searchContactInfo) {
        this.showNotification('warning', '请填写联系方式', '请输入下单时使用的联系方式');
        return;
      }
      
      try {
        const response = await axios.get(`/api/card-keys-by-contact/${encodeURIComponent(this.searchContactInfo)}`);
        
        if (response.data.success) {
          this.myCardKeys = response.data.data;
          
          if (this.myCardKeys.length === 0) {
            this.showNotification('info', '没有找到卡密', '使用该联系方式没有找到卡密');
          }
        } else {
          this.showNotification('error', '查询失败', response.data.message || '无法查询卡密');
        }
      } catch (error) {
        console.error('查询卡密失败:', error);
        this.showNotification('error', '查询失败', '网络错误，请稍后再试');
      }
    },
    
    // 查看订单详情
    async viewOrderDetail(order) {
      this.selectedOrder = order;
      this.previousPage = this.currentPage;
      this.currentPage = 'order-detail';
      
      // 如果订单状态为pending，刷新一次订单状态
      if (order.status === 'pending') {
        await this.refreshOrderDetail();
      }
    },
    
    // 刷新订单详情
    async refreshOrderDetail() {
      if (!this.selectedOrder) return;
      
      try {
        const response = await axios.get(`/api/check-payment/${this.deviceUuid}/${this.selectedOrder.id}`);
        
        if (response.data.success) {
          // 更新订单状态
          this.selectedOrder = {
            ...this.selectedOrder,
            ...response.data.data
          };
          
          // 如果订单已完成，显示成功通知
          if (this.selectedOrder.status === 'completed') {
            this.showNotification('success', '订单已完成', '您的订单已支付成功');
          }
        } else {
          this.showNotification('error', '刷新失败', response.data.message || '无法刷新订单状态');
        }
      } catch (error) {
        console.error('刷新订单详情失败:', error);
        this.showNotification('error', '刷新失败', '网络错误，请稍后再试');
      }
    },
    
    // 从本地存储加载联系方式
    loadContactInfo() {
      const savedContactInfo = localStorage.getItem('contactInfo');
      if (savedContactInfo) {
        this.contactInfo = savedContactInfo;
        this.searchContactInfo = savedContactInfo;
      }
    },
    
    // 处理URL参数
    handleUrlParams() {
      const urlParams = new URLSearchParams(window.location.search);
      
      // 处理订单ID参数
      const orderId = urlParams.get('orderId');
      if (orderId) {
        this.loadOrderById(orderId);
      }
      
      // 处理联系方式参数
      const contactInfo = urlParams.get('contact');
      if (contactInfo) {
        this.searchContactInfo = decodeURIComponent(contactInfo);
        this.goToOrdersPage();
      }
    },
    
    // 通过ID加载订单
    async loadOrderById(orderId) {
      try {
        const response = await axios.get(`/api/check-payment/${this.deviceUuid}/${orderId}`);
        
        if (response.data.success) {
          this.selectedOrder = response.data.data;
          this.currentPage = 'order-detail';
        } else {
          this.showNotification('error', '加载失败', response.data.message || '无法加载订单');
        }
      } catch (error) {
        console.error('加载订单失败:', error);
        this.showNotification('error', '加载失败', '网络错误，请稍后再试');
      }
    },
    
    // 复制到剪贴板
    copyToClipboard(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          this.showNotification('success', '复制成功', '内容已复制到剪贴板');
        } else {
          this.showNotification('error', '复制失败', '请手动复制');
        }
      } catch (err) {
        this.showNotification('error', '复制失败', '请手动复制');
      }
      
      document.body.removeChild(textarea);
    },
    
    // 显示通知
    showNotification(type, title, message) {
      // 清除之前的超时
      if (this.notification.timeout) {
        clearTimeout(this.notification.timeout);
      }
      
      // 设置通知内容
      this.notification.type = type;
      this.notification.title = title;
      this.notification.message = message;
      this.notification.show = true;
      
      // 3秒后自动关闭
      this.notification.timeout = setTimeout(() => {
        this.closeNotification();
      }, 3000);
    },
    
    // 关闭通知
    closeNotification() {
      this.notification.show = false;
    },
    
    // 切换主题
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;
      document.body.classList.toggle('light-theme', !this.isDarkTheme);
      localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
    },
    
    // 获取通知图标
    getNotificationIcon() {
      switch (this.notification.type) {
        case 'success': return 'ri-check-line';
        case 'error': return 'ri-error-warning-line';
        case 'warning': return 'ri-alert-line';
        case 'info': return 'ri-information-line';
        default: return 'ri-information-line';
      }
    },
    
    // 获取订单状态类名
    getOrderStatusClass(status) {
      switch (status) {
        case 'completed': return 'status-success';
        case 'pending': return 'status-warning';
        case 'processing': return 'status-info';
        case 'expired': return 'status-danger';
        default: return 'status-info';
      }
    },
    
    // 获取订单状态文本
    getOrderStatusText(status) {
      switch (status) {
        case 'completed': return '已完成';
        case 'pending': return '待支付';
        case 'processing': return '处理中';
        case 'expired': return '已过期';
        default: return '未知状态';
      }
    },
    
    // 获取库存状态类名
    getStockStatusClass(count) {
      if (count <= 0) return 'status-danger';
      if (count <= 5) return 'status-warning';
      return 'status-success';
    },
    
    // 获取库存状态文本
    getStockStatusText(count) {
      if (count <= 0) return '已售罄';
      if (count <= 5) return '库存紧张';
      return '库存充足';
    },
    
    // 格式化日期
    formatDate(timestamp) {
      if (!timestamp) return '-';
      
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },
    
    // 导航方法
    goBack() {
      if (this.previousPage) {
        this.currentPage = this.previousPage;
        this.previousPage = null;
      } else {
        this.goToProductsPage();
      }
    },
    
    goToProductsPage() {
      this.currentPage = 'products';
    },
    
    goToOrdersPage() {
      this.currentPage = 'orders';
    },
    
    goToCardKeysPage() {
      this.currentPage = 'card-keys';
    }
  }
});
