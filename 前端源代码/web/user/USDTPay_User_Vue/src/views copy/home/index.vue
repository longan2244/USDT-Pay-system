<template>
  <div class="home-container">

    <!-- 头部 -->
    <div class="header">
      <h1>USDT商城支付</h1>
      <button class="btn btn-link text-white" @click="showMyCards">我的卡密</button>
    </div>

    <!-- 商品列表 -->
    <div class="product-list-container">
      <div class="product-list">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-light" role="status">
            <span class="visually-hidden">加载中...</span>
          </div>
        </div>
        <div v-else>

          <div v-for="product in products" :key="product.id" class="product-card">
            <div class="product-card-content">
              <div class="product-header">
                <h3 class="product-title">{{ product.name }}</h3>
                <span class="stock-badge" :class="{ 'low-stock': product.availableCount <= 0 }">
                  库存 {{ product.availableCount }}
                </span>
              </div>

              <div class="product-details">
                <div class="price-tag">

                  <span class="amount">{{ product.price.toFixed(2) }}</span>
                  <span class="currency">USDT</span>
                </div>

                <div class="quantity-controls">
                  <button class="ctrl-btn" :class="{ disabled: !cart[product.id] }"
                    @click="decreaseQuantity(product.id)">
                    <i class="minus-icon"></i>
                  </button>
                  <span class="quantity">{{ cart[product.id] || 0 }}</span>
                  <button class="ctrl-btn" :class="{ disabled: cart[product.id] >= product.availableCount }"
                    @click="increaseQuantity(product.id, product.availableCount)">
                    <i class="plus-icon"></i>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>

    <!-- 底部结算栏 -->
    <div class="checkout-bar">
      <div class="checkout-container">
        <div class="total-info">
          <div class="total-items">
            <span class="total-label">共计商品:</span>
            <span class="total-value">{{ selectedCount }}个</span>
          </div>
          <div class="total-price">
            <span class="total-label">共计:</span>
            <span class="total-value">{{ totalAmount.toFixed(2) }} USDT</span>
          </div>
        </div>
        <button class="checkout-btn" :disabled="selectedCount === 0" @click="checkout">
          <span class="btn-text">立即支付</span>
          <i class="checkout-icon"></i>
        </button>
      </div>
    </div>

    <!-- 支付模态框 -->
    <div class="modal fade" id="paymentModal" tabindex="-1" aria-labelledby="paymentModalLabel" aria-hidden="true"
      data-bs-backdrop="static" data-bs-keyboard="false">
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div class="modal-content payment-modal-content">
          <div class="modal-header payment-header">
            <h5 class="modal-title" id="paymentModalLabel">确认支付</h5>
            <!-- <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button> -->
          </div>
          <div class="modal-body payment-body">
            <div class="payment-amount">
              <span class="amount-label">支付金额</span>
              <span class="amount-value">{{ currentPayment.amount }} USDT</span>
            </div>

            <div class="payment-instructions">
              <div class="instruction-title">
                <i class="instruction-icon"></i>
                <span>请使用USDT(TRC20)向以下地址转账</span>
              </div>

              <div class="qr-code-container">
                <qrcode-vue :value="currentPayment.paymentAddress" :size="100" level="H" :margin="1" render-as="svg" />
              </div>

              <div class="address-container">
                <div class="address-label">钱包地址</div>
                <div class="address-copy-group">
                  <input type="text" class="address-input" :value="currentPayment.paymentAddress" readonly>
                  <button class="copy-address-btn" @click="copyToClipboard(currentPayment.paymentAddress)">
                    <i class="copy-icon"></i>
                    <span>复制</span>
                  </button>
                </div>
              </div>

              <div class="payment-warning">
                <i class="warning-icon"></i>
                <div class="warning-text">
                  请务必转账<span class="highlight">精确金额</span>，否则系统无法自动确认您的支付！
                </div>
              </div>

              <div class="payment-expiry" v-if="currentPayment.expiresAt">
                <i class="time-icon"></i>
                <span>订单有效期至: {{ new Date(currentPayment.expiresAt).toLocaleString() }}</span>
              </div>
            </div>

            <div id="paymentStatus" class="payment-status pending">
              <div class="status-icon"></div>
              <div class="status-text">等待支付{{ currentPayment.amount }} USDT中...</div>
            </div>

            <div class="auto-detection">
              <div class="detection-text">
                <i class="detection-icon"></i>
                <span>系统将自动检测您的支付，支付完成后无需手动操作</span>
              </div>
              <div class="progress-container">
                <div class="progress-bar"></div>
              </div>
            </div>
          </div>
          <!-- <div class="modal-footer payment-footer">
            <button type="button" class="close-btn" data-bs-dismiss="modal">关闭</button>
          </div> -->
        </div>
      </div>
    </div>

    <!-- 支付成功模态框 -->
    <div class="modal fade" id="paymentSuccessModal" tabindex="-1" aria-labelledby="paymentSuccessModalLabel"
      aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div class="modal-content success-modal-content">
          <div class="modal-header success-header">
            <h5 class="modal-title" id="paymentSuccessModalLabel">支付成功</h5>
            <!-- <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button> -->
          </div>
          <div class="modal-body success-body">
            <div class="success-icon-container">
              <div class="success-icon"></div>
            </div>

            <div class="success-message">
              <h4>恭喜您，支付已完成！</h4>
              <p>您的卡密信息如下：</p>
            </div>

            <div class="card-keys-container">
              <div v-if="successCardKeys.length > 0" class="card-keys-list">
                <div v-for="(cardInfo, index) in successCardKeys" :key="index" class="card-key-item">
                  <div class="card-key-product">{{ cardInfo.productName }}</div>
                  <div class="card-key-value">{{ cardInfo.key }}</div>
                </div>
              </div>
              <div v-else-if="singleCardKey" class="card-keys-list">
                <div class="card-key-item">
                  <div class="card-key-product">{{ singleCardKey.productName }}</div>
                  <div class="card-key-value">{{ singleCardKey.key }}</div>
                </div>
              </div>
              <div v-else class="no-card-keys">
                <p>暂无可用卡密，请联系客服</p>
              </div>

              <button class="copy-all-btn" @click="copyAllCardKeys">
                <i class="copy-all-icon"></i>
                <span>复制全部卡密</span>
              </button>
            </div>
          </div>
          <div class="modal-footer success-footer">
            <button type="button" class="close-btn" data-bs-dismiss="modal">关闭</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 联系方式模态框 -->
    <div class="modal fade" id="contactInfoModal" tabindex="-1" aria-labelledby="contactInfoModalLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div class="modal-content contact-modal-content">
          <div class="modal-header contact-header">
            <h5 class="modal-title" id="contactInfoModalLabel">
              <i class="contact-icon"></i>
              <span>填写联系方式</span>
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body contact-body">
            <div class="contact-form">
              <div class="input-container">
                <label for="contactInfoInput">联系方式</label>
                <input type="text" id="contactInfoInput" class="contact-input" v-model="contactInfo"
                  placeholder="请输入您的联系方式" autocomplete="off">
              </div>

              <div class="privacy-notice">
                <div class="notice-icon"></div>
                <div class="notice-content">
                  <h6>隐私提示</h6>
                  <p>请使用不易被他人猜到的联系方式，将用于后续查询订单和卡密</p>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer contact-footer">
            <button type="button" class="cancel-btn" data-bs-dismiss="modal">取消</button>
            <button type="button" class="confirm-btn" @click="proceedToPayment">确认</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 我的卡密模态框 -->
    <div class="modal fade" id="myCardsModal" tabindex="-1" aria-labelledby="myCardsModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div class="modal-content mycards-modal-content">
          <div class="modal-header mycards-header">
            <h5 class="modal-title" id="myCardsModalLabel">
              <i class="cards-icon"></i>
              <span>我的卡密</span>
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body mycards-body">
            <div class="search-section">
              <h6 class="search-title">
                <i class="search-icon"></i>
                <span>查询我的卡密</span>
              </h6>
              <div class="search-form">
                <input type="text" class="search-input" v-model="searchContactInfo" placeholder="输入购买时填写的联系方式"
                  autocomplete="off">
                <button class="search-button" @click="searchCardsByContact">
                  <i class="search-btn-icon"></i>
                  <span>查询</span>
                </button>
              </div>
            </div>

            <div class="results-section">
              <div v-if="myCards.length > 0" class="cards-list">
                <div v-for="card in myCards" :key="card.id" class="card-item">
                  <div class="card-header">
                    <span class="card-product">{{ card.productName }}</span>
                    <button class="card-copy-btn" @click="copyToClipboard(card.key)">
                      <i class="card-copy-icon"></i>
                      <span>复制</span>
                    </button>
                  </div>
                  <div class="card-content">
                    <span class="card-label">卡密:</span>
                    <span class="card-value">{{ card.key }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="no-results">
                <div class="no-results-icon"></div>
                <p class="no-results-text">暂无卡密记录</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Modal } from 'bootstrap';
import MessageBox from '@/components/MessageBox';
import '@/assets/message.css';
import useClipboard from 'vue-clipboard3'

import { v4 as uuidv4 } from 'uuid';
const { toClipboard } = useClipboard()
import QrcodeVue from 'qrcode.vue'
// import type { Level, RenderAs, GradientType, ImageSettings } from 'qrcode.vue'




// 响应式数据
const deviceUuid = ref(localStorage.getItem('deviceUuid') || (() => {
  const uuid = uuidv4();
  localStorage.setItem('deviceUuid', uuid);
  return uuid;
})());

const cart = ref({});
const products = ref([]);
const loading = ref(true);
const currentOrderId = ref(null);
const currentPayment = ref({
  amount: 0,
  paymentAddress: '',
  expiresAt: null,
  orderId: null
});
const successCardKeys = ref([]);
const singleCardKey = ref(null);
const myCards = ref([]);
const orderStatusInterval = ref(null);
const contactInfo = ref(localStorage.getItem('contactInfo') || '');
const searchContactInfo = ref('');
const pendingOrderItems = ref([]);

// 计算属性
const selectedCount = computed(() => {
  let count = 0;
  for (const productId in cart.value) {
    count += cart.value[productId] || 0;
  }
  return count;
});

const totalAmount = computed(() => {
  let total = 0;
  for (const productId in cart.value) {
    if (cart.value[productId] > 0) {
      const product = products.value.find(p => p.id === parseInt(productId));
      if (product) {
        total += product.price * cart.value[productId];
      }
    }
  }
  return total;
});

// 方法
const loadProducts = async () => {
  try {
    loading.value = true;
    const response = await fetch('/api/products');
    const result = await response.json();

    if (result.success) {
      products.value = result.data;
      products.value.forEach(product => {
        cart.value[product.id] = 0;
      });
    } else {
      console.error('加载商品失败:', result.message);
    }
  } catch (error) {
    console.error('加载商品出错:', error);
  } finally {
    loading.value = false;
  }
};

const increaseQuantity = (productId, availableCount) => {
  if (cart.value[productId] < availableCount) {
    cart.value[productId] = (cart.value[productId] || 0) + 1;
  }
};

const decreaseQuantity = (productId) => {
  if (cart.value[productId] > 0) {
    cart.value[productId] = cart.value[productId] - 1;
  }
};

const checkout = () => {
  //改变浏览器状态栏颜色


  const orderItems = [];
  for (const productId in cart.value) {
    if (cart.value[productId] > 0) {
      const product = products.value.find(p => p.id === parseInt(productId));
      if (product) {
        orderItems.push({
          productId: parseInt(productId),
          quantity: cart.value[productId],
          name: product.name,
          price: product.price
        });
      }
    }
  }

  if (orderItems.length === 0) {
    MessageBox.warning('请选择至少一个商品');
    return;
  }

  pendingOrderItems.value = orderItems;

  if (localStorage.getItem('contactInfo')) {
    contactInfo.value = localStorage.getItem('contactInfo');
  }

  const contactInfoModal = new Modal(document.getElementById('contactInfoModal'));
  contactInfoModal.show();
};

const proceedToPayment = () => {
  if (!contactInfo.value) {
    MessageBox.warning('请填写联系方式，以便查询订单和卡密');
    return;
  }

  localStorage.setItem('contactInfo', contactInfo.value);

  const contactInfoModal = Modal.getInstance(document.getElementById('contactInfoModal'));
  if (contactInfoModal) {
    contactInfoModal.hide();
  }

  createPayment(pendingOrderItems.value);
};
// 在组件卸载时恢复原始颜色

const createPayment = async (orderItems, retryCount = 0) => {
  try {
    localStorage.setItem('contactInfo', contactInfo.value);

    const orderData = {
      deviceUuid: deviceUuid.value,
      contactInfo: contactInfo.value,
      items: orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    if (orderItems.length === 1 && orderItems[0].quantity === 1) {
      orderData.productId = orderItems[0].productId;
    }

    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (result.success) {

      currentPayment.value = {
        amount: result.data.amount,
        paymentAddress: result.data.paymentAddress,
        expiresAt: result.data.expiresAt,
        orderId: result.data.orderId
      };

      const paymentModal = new Modal(document.getElementById('paymentModal'), {
        backdrop: 'static', // 防止点击外部关闭
        keyboard: false,    // 防止 ESC 键关闭
        focus: true         // 自动聚焦到模态框
      });
      paymentModal.show();

      startOrderStatusPolling(result.data.orderId);
    } else {
      // 处理错误情况
      if (result.retryable && retryCount < 3) {
        console.log(`尝试重新创建订单，第 ${retryCount + 1} 次尝试`);
        // 短暂延迟后重试
        setTimeout(() => {
          createPayment(orderItems, retryCount + 1);
        }, 1000);
      } else {
        // 显示更友好的错误消息
        let errorMessage = result.message;

        // // 针对特定错误类型提供更友好的提示
        // if (errorMessage.includes('太多未完成的订单')) {
        //   errorMessage = '您有未完成的订单，请先完成现有订单后再创建新订单。';
        // } else if (errorMessage.includes('创建订单过于频繁')) {
        //   errorMessage = '请勿频繁创建订单，请稍后再试。';
        // }

        MessageBox.error(`${errorMessage}`);
      }
    }
  } catch (error) {
    console.error('创建订单出错:', error);
    MessageBox.error('创建订单出错，请稍后再试');
  }
};

const updatePaymentStatus = (message, type, txHash = '') => {
  const statusDiv = document.querySelector('#paymentStatus');
  if (statusDiv) {
    statusDiv.className = `payment-status ${type}`;
    let statusText = document.querySelector('#paymentStatus .status-text');
    if (statusText) {
      statusText.textContent = message;
    } else {
      statusDiv.innerHTML = `<div class="status-icon"></div><div class="status-text">${message}</div>`;
    }
  }
};

const startOrderStatusPolling = (orderId) => {
  if (orderStatusInterval.value) {
    clearInterval(orderStatusInterval.value);
  }

  orderStatusInterval.value = setInterval(async () => {
    try {
      const response = await fetch(`/api/check-payment/${deviceUuid.value}/${orderId}`);
      const result = await response.json();

      if (result.success) {
        const order = result.data;

        switch (order.status) {
          case 'pending':
            // updatePaymentStatus('等待支付中...', 'pending');
            break;
          case 'processing':
            updatePaymentStatus('交易已提交，等待区块确认...', 'processing', order.pendingTxHash);
            break;
          case 'expired':
            clearInterval(orderStatusInterval.value);
            updatePaymentStatus('订单已过期，请重新创建订单', 'expired');
            setTimeout(() => {
              const paymentModal = Modal.getInstance(document.getElementById('paymentModal'));
              if (paymentModal) {
                paymentModal.hide();
              }
              MessageBox.warning('订单已过期，请重新创建订单');
              loadProducts();
              resetCart();
            }, 2000);
            break;
          case 'completed':
            clearInterval(orderStatusInterval.value);

            const paymentModal = Modal.getInstance(document.getElementById('paymentModal'));
            if (paymentModal) {
              paymentModal.hide();
            }
            loadProducts();
            showPaymentSuccess(order);
            resetCart();
            break;
        }
      }
    } catch (error) {
      console.error('轮询订单状态出错:', error);
    }
  }, 5000);
};

const showPaymentSuccess = (order) => {
  successCardKeys.value = [];
  singleCardKey.value = null;

  if (order.cardKeys && order.cardKeys.length > 0) {
    successCardKeys.value = order.cardKeys.map(cardInfo => ({
      productName: cardInfo.productName,
      key: cardInfo.key
    }));
  } else if (order.cardKey) {
    singleCardKey.value = {
      productName: order.productName,
      key: order.cardKey
    };
  }

  const successModal = new Modal(document.getElementById('paymentSuccessModal'));
  successModal.show();
};

const copyAllCardKeys = async () => {
  let cardTexts = [];

  if (successCardKeys.value.length > 0) {
    cardTexts = successCardKeys.value.map(cardInfo =>
      `${cardInfo.productName}卡密: ${cardInfo.key}`
    );
  } else if (singleCardKey.value) {
    cardTexts.push(`${singleCardKey.value.productName}卡密: ${singleCardKey.value.key}`);
  }

  if (cardTexts.length > 0) {
    const allCardText = cardTexts.join('\n');
    await copyToClipboard(allCardText);
  }
};

const resetCart = () => {
  for (const productId in cart.value) {
    cart.value[productId] = 0;
  }
};

const showMyCards = async () => {
  try {
    const response = await fetch(`/api/card-keys/${deviceUuid.value}`);
    const result = await response.json();

    if (result.success) {
      myCards.value = result.data;

      if (contactInfo.value) {
        searchContactInfo.value = contactInfo.value;
      }

      const myCardsModal = new Modal(document.getElementById('myCardsModal'));
      myCardsModal.show();
    } else {
      console.error('加载卡密失败:', result.message);
    }
  } catch (error) {
    console.error('加载卡密出错:', error);
  }
};

const searchCardsByContact = async () => {
  if (!searchContactInfo.value) {
    MessageBox.warning('请输入联系方式');
    return;
  }

  try {
    const response = await fetch(`/api/card-keys-by-contact/${encodeURIComponent(searchContactInfo.value)}`);
    const result = await response.json();

    if (result.success) {
      myCards.value = result.data;

      if (myCards.value.length === 0) {
        MessageBox.info('未找到与该联系方式关联的卡密');
      }
    } else {
      console.error('查询卡密失败:', result.message);
      MessageBox.error('查询卡密失败: ' + result.message);
    }
  } catch (error) {
    console.error('查询卡密出错:', error);
    MessageBox.error('查询卡密出错，请稍后再试');
  }
};

const copyToClipboard = async (text) => {

  navigator.clipboard.writeText(text).then(() => {
    MessageBox.success('复制成功！');
  }).catch(err => {
    var Url2 = text;
    var oInput = document.createElement('input');
    oInput.value = Url2;
    document.body.appendChild(oInput);
    oInput.select(); // 选择对象
    document.execCommand("Copy"); // 执行浏览器复制命令
    oInput.className = 'oInput';
  }).catch(err => {
    toClipboard(text).catch(err => {
      MessageBox.error('复制失败，请手动复制');
    })
  })
    .catch(err => {

      MessageBox.error('复制失败，请手动复制');
    })

};

// 生命周期钩子
onMounted(() => {
  loadProducts();
});



</script>

<style lang="less">
@import './index.less';

/* 颜色变量定义 */
@color_1: rgba(255, 255, 255, 0.6);
/* 次要文本颜色 */
@color_2: #fff;
/* 主要文本颜色 */
@color_3: #c76af5;
/* 主题色（紫色） */
@color_4: white;
/* 纯白色 */
@color_5: rgba(255, 255, 255, 0.4);
/* 禁用状态文本颜色 */
@color_6: rgba(255, 255, 255, 0.7);
/* 普通文本颜色 */
@color_7: rgba(255, 255, 255, 0.9);
/* 高亮文本颜色 */
@color_8: #ff5757;
/* 警告/错误颜色 */

/* 字体和边框颜色变量 */
@font_family_1: monospace;
/* 等宽字体，用于显示地址等信息 */
@border_color_1: rgba(199, 106, 245, 0.5);
/* 主题边框颜色 */

/* 进度条动画效果 */
@keyframes progress {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(400%);
  }
}






/* 底部结算栏样式 */
.checkout-bar {
  position: fixed;
  /* 固定在底部 */
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(26, 26, 26, 0.95);
  /* 半透明深色背景 */
  backdrop-filter: blur(20px);
  /* 背景模糊效果 */
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  /* 顶部细边框 */
  padding: 1rem;
  z-index: 1000;
  /* 确保显示在其他内容之上 */
}

/* 结算栏内容容器 */
.checkout-container {
  display: flex;
  justify-content: space-between;
  /* 两端对齐布局 */
  align-items: center;
  /* 垂直居中对齐 */
  width: 100%;
}

.total-info {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.total-items {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.total-price {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .total-value {
    color: @color_3;
    font-size: 1.25rem;
    font-weight: 700;
  }
}

.total-label {
  color: @color_1;
  font-size: 0.875rem;
}

.total-value {
  color: @color_2;
  font-weight: 600;
  font-size: 1rem;
}

.checkout-btn {
  background: linear-gradient(135deg, #c76af5 0%, #7a3bff 100%);
  border: none;
  border-radius: 12px;
  padding: 0.875rem 2rem;
  color: @color_4;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 140px;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(122, 59, 255, 0.15);

  &:disabled {
    background: rgba(255, 255, 255, 0.08);
    color: @color_5;
    box-shadow: none;
  }

  &:not(:disabled) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(122, 59, 255, 0.25);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(122, 59, 255, 0.2);
    }
  }
}

.checkout-icon {
  display: inline-block;
  width: 22px;
  height: 22px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='2' y='4' width='20' height='16' rx='2'/%3E%3Cline x1='2' y1='10' x2='22' y2='10'/%3E%3Cline x1='6' y1='16' x2='10' y2='16'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 1;
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.4));
  margin-left: 4px;
  transform: translateY(-1px);
}

.amount-label {
  color: @color_1;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.amount-value {
  color: @color_3;
  font-size: 1.5rem;
  font-weight: 700;
}

/* 支付说明区域样式 */
.payment-instructions {
  display: flex;
  flex-direction: column;
  /* 垂直排列 */
  gap: 1.25rem;
  /* 子元素间距 */
  background: rgba(255, 255, 255, 0.05);
  /* 微亮背景 */
  border-radius: 12px;
  /* 圆角边框 */
  padding: 1.25rem;
}

.instruction-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: @color_2;
  font-weight: 600;
}

.instruction-icon {
  display: inline-block;
  width: 18px;
  height: 18px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c76af5'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

.qr-code-container {
  display: flex;
  display: flex;
  justify-content: center;
  padding: 1.5rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
  border-radius: 16px;
  width: fit-content;
  margin: 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin: 0.5rem auto;
}

.custom-qr {
  border-radius: 8px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.address-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.address-label {
  color: @color_6;
  font-size: 0.875rem;
}

.address-copy-group {
  display: flex;
  gap: 0.5rem;
}

.address-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem;
  color: @color_2;
  font-family: @font_family_1;
  font-size: 0.875rem;
}

.copy-address-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  padding: 0 1rem;
  color: @color_2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.copy-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

/* 支付警告提示框样式 */
.payment-warning {
  display: flex;
  align-items: flex-start;
  /* 顶部对齐 */
  gap: 0.75rem;
  /* 图标和文本间距 */
  background: rgba(255, 87, 87, 0.1);
  /* 淡红色警告背景 */
  border-radius: 8px;
  padding: 0.75rem;
}

.warning-icon {
  display: inline-block;
  min-width: 20px;
  height: 20px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff5757'%3E%3Cpath d='M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

.warning-text {
  color: @color_7;
  font-size: 0.875rem;
  line-height: 1.4;
}

.highlight {
  color: @color_8;
  font-weight: 600;
  margin: 0 0.25rem;
}

.payment-expiry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: @color_6;
  font-size: 0.875rem;
}

.time-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='rgba(255,255,255,0.7)'%3E%3Cpath d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z'/%3E%3Cpath d='M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

.payment-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
}

.payment-status.pending {
  background: rgba(255, 193, 7, 0.1);
}

.payment-status.processing {
  background: rgba(33, 150, 243, 0.1);
}

.payment-status.expired {
  background: rgba(244, 67, 54, 0.1);
}

.status-icon {
  width: 24px;
  height: 24px;
  background-size: contain;
  background-repeat: no-repeat;
}

.pending {
  .status-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffc107'%3E%3Cpath d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z'/%3E%3Cpath d='M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z'/%3E%3C/svg%3E");
  }
}

.processing {
  .status-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232196f3'%3E%3Cpath d='M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z'/%3E%3C/svg%3E");
  }
}

.expired {
  .status-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f44336'%3E%3Cpath d='M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z'/%3E%3C/svg%3E");
  }
}

.status-text {
  color: @color_2;
  font-weight: 500;
}

.auto-detection {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detection-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: @color_6;
  font-size: 0.875rem;
}

// 无限转圈圈
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.detection-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='rgba(255,255,255,0.7)'%3E%3Cpath d='M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  // 无限转圈圈
  animation: spin 2s linear infinite;


}

.progress-container {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: 30%;
  background: linear-gradient(90deg, #c76af5 0%, #7a3bff 100%);
  border-radius: 2px;
  animation: progress 2s infinite linear;
}

.payment-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: @color_2;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.success-modal-content {
  background: #1a1a1a;
  border: none;
  border-radius: 16px;
}

.success-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.25rem 1.5rem;
}

.success-body {
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.success-icon-container {
  width: 80px;
  height: 80px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-icon {
  width: 48px;
  height: 48px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234caf50'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

.success-message {
  text-align: center;

  h4 {
    color: @color_2;
    margin-bottom: 0.5rem;
  }

  p {
    color: @color_6;
    margin: 0;
  }
}

.card-keys-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-keys-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-key-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
}

.card-key-product {
  color: @color_6;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.card-key-value {
  color: @color_2;
  font-family: @font_family_1;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.75rem;
  border-radius: 6px;
  word-break: break-all;
}

.no-card-keys {
  text-align: center;
  padding: 2rem 0;
  color: @color_1;
}

.copy-all-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  padding: 0.75rem;
  color: @color_2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  margin-top: 0.5rem;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.copy-all-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

.success-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
}

.contact-modal-content {
  background: #1a1a1a;
  border: none;
  border-radius: 16px;
}

.contact-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.25rem 1.5rem;
}

.contact-icon {
  display: inline-block;
  width: 18px;
  height: 18px;
  margin-right: 0.5rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c76af5'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  vertical-align: middle;
}

.contact-body {
  padding: 1.5rem;
}

.input-container {
  margin-bottom: 1.5rem;

  label {
    display: block;
    color: @color_6;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }
}

.contact-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: @color_2;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: @border_color_1;
    background: rgba(255, 255, 255, 0.1);
  }

  &::placeholder {
    color: @color_5;
  }
}

.privacy-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
}

.notice-icon {
  display: inline-block;
  min-width: 20px;
  height: 20px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c76af5'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

.notice-content {
  h6 {
    color: @color_2;
    margin: 0 0 0.25rem 0;
    font-size: 0.875rem;
  }

  p {
    color: @color_1;
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.4;
  }
}

.contact-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  color: @color_6;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.confirm-btn {
  background: linear-gradient(135deg, #c76af5 0%, #7a3bff 100%);
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: @color_4;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(199, 106, 245, 0.3);
  }
}

.mycards-modal-content {
  background: #1a1a1a;
  border: none;
  border-radius: 16px;
}

.mycards-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.25rem 1.5rem;
}

.cards-icon {
  display: inline-block;
  width: 18px;
  height: 18px;
  margin-right: 0.5rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c76af5'%3E%3Cpath d='M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  vertical-align: middle;
}

.mycards-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.search-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.25rem;
}

.search-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: @color_2;
  margin-bottom: 1rem;
  font-weight: 500;
}

.search-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c76af5'%3E%3Cpath d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

.search-form {
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.search-input {
  // flex: 1;
  width: 70%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: @color_2;
  transition: all 0.2s;
  display: flex;
  align-items: center;

  // gap: 0.5rem

  &:focus {
    outline: none;
    border-color: @border_color_1;
    background: rgba(255, 255, 255, 0.15);
  }

  &::placeholder {
    color: @color_5;
  }
}

.search-button {
  background: linear-gradient(135deg, #c76af5 0%, #7a3bff 100%);
  border: none;
  border-radius: 8px;
  padding: 0 1.25rem;
  color: @color_4;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(199, 106, 245, 0.3);
  }
}

.search-btn-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

.results-section {
  flex: 1;
  overflow-y: auto;
  max-height: 50vh;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.card-product {
  color: @color_2;
  font-weight: 600;
}

.card-copy-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: @color_2;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.card-copy-icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  vertical-align: middle;
}

.payment-modal-content {
  background: #1a1a1a;
  border: none;
  border-radius: 16px;
}

.payment-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.25rem 1.5rem;
}

.payment-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.payment-amount {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  // margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .checkout-bar {
    padding: 0.875rem;
  }

  .checkout-container {
    gap: 0.75rem;
  }

  .checkout-btn {
    padding: 0.75rem 1.5rem;
    min-width: 120px;
    display: flex;
    align-items: center;
  }

  .total-price {
    .total-value {
      font-size: 1.125rem;
    }
  }

  .payment-body {
    padding: 1rem;
    gap: 0.875rem;
  }

  .payment-instructions {
    gap: 1rem;
  }

  .payment-amount {
    // margin-bottom: 0.5rem;
  }

  .amount-value {
    font-size: 1.25rem;
  }

  .instruction-title {
    font-size: 0.9rem;
  }

  .payment-warning {
    padding: 0.625rem;
    font-size: 0.875rem;
  }

  .auto-detection {
    gap: 0.5rem;
  }

  .detection-text {
    font-size: 0.875rem;
  }
}
</style>
