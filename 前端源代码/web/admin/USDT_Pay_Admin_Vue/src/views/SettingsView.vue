<script setup>
import { ref, onMounted, computed } from 'vue'
import { getSettings, updateSettings, restorePreviousSettings } from '../api/settings'
import ModalDialog from '../components/ModalDialog.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { showNotification } from '@/util/notification'
import { useRouter } from 'vue-router' // 添加这一行
const router = useRouter() // 添加这一行
// 系统设置
const settings = ref({
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
})

const originalSettings = ref({})
const showPassword = ref(false)
const showPrivateKey = ref(false)

// 模态框
const showModal = ref(false)
const modalType = ref('')
const modalTitle = ref('')

// 加载状态
const loading = ref(false)

// 高亮元素
const highlightedElements = ref([])

// 计算属性
const criticalSettingsMissing = computed(() => {
  return !settings.value.walletAddress || !settings.value.apiKey
})

// 方法
const fetchSettings = async () => {
  loading.value = true
  try {
    const response = await getSettings()

    // 由于在request.js中已经处理了响应拦截，这里直接使用返回的数据
    settings.value = response.data
    // 保存原始设置，用于比较是否有修改
    originalSettings.value = JSON.parse(JSON.stringify(response.data))

    // 检查关键设置是否为空
    if (criticalSettingsMissing.value) {
      // 自动高亮关键设置字段
      highlightElements(['.usdtinput', '.apikeyinput'])
    }
  } catch (error) {
    console.error('获取系统设置失败:', error)
  } finally {
    loading.value = false
  }
}

const saveSettings = () => {
  if (!settings.value.walletAddress || !settings.value.apiKey) {
    showNotification('error', '配置错误', 'USDT地址和API密钥不能为空')
    highlightElements(['.usdtinput', '.apikeyinput'])
    return
  }

  // 显示确认对话框
  modalType.value = 'confirmSettings'
  modalTitle.value = '确认修改系统设置'
  showModal.value = true
}

const submitSettingsChanges = async () => {
  try {
    loading.value = true
    // 发送更新请求
    const response = await updateSettings(settings.value)

    // 由于在request.js中已经处理了响应拦截，这里直接使用返回的数据
    settings.value = response.data
    originalSettings.value = JSON.parse(JSON.stringify(response.data))

    closeModal()

    // 根据是否配置了关键设置显示不同的通知
    if (settings.value.walletAddress && settings.value.apiKey) {
      showNotification('success', '系统设置已保存', '所有配置已完成，系统可以正常使用')

      // 如果之前没有配置关键设置，但现在已配置，刷新页面以更新导航

      setTimeout(() => {
        router.go(0)
      }, 1000) // 延迟1秒以便用户看到通知

    } else {
      showNotification('warning', '系统设置已保存', '但关键配置仍未完成，部分功能将不可用')
    }

  } catch (error) {
    console.error('保存系统设置失败:', error)
    showNotification('error', '保存失败', '系统设置保存失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const resetSettings = async () => {
  // 恢复上一次的设置
  try {
    loading.value = true
    const response = await restorePreviousSettings()

    // 由于在request.js中已经处理了响应拦截，这里直接使用返回的数据
    settings.value = response.data
    originalSettings.value = JSON.parse(JSON.stringify(response.data))

    showNotification('info', '设置已撤回', '已恢复到上一次保存的设置')
  } catch (error) {
    console.error('恢复上一次设置失败:', error)
    showNotification('error', '撤回失败', '无法恢复上一次的设置')
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  showModal.value = false
}

const submitModal = async () => {
  if (modalType.value === 'confirmSettings') {
    await submitSettingsChanges()
  } else {
    closeModal()
  }
}

// 高亮显示元素
const highlightElements = (selectors) => {
  // 清除之前的高亮
  clearHighlights()

  // 添加高亮类
  selectors.forEach(selector => {
    const element = document.querySelector(selector)
    if (element) {
      element.classList.add('highlight-section')
      highlightedElements.value.push(element)

      // 滚动到第一个元素
      if (selectors.indexOf(selector) === 0) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  })

  // 3秒后自动清除高亮
  setTimeout(() => {
    clearHighlights()
  }, 3000)
}

// 清除高亮
const clearHighlights = () => {
  highlightedElements.value.forEach(element => {
    element.classList.remove('highlight-section')
  })
  highlightedElements.value = []
}

// 生命周期钩子
onMounted(() => {
  fetchSettings()
})
</script>

<template>
  <div class="settings-page">
    <LoadingSpinner :is-loading="loading" />

    <div class="page-header">
      <h2>系统设置</h2>
    </div>

    <div class="settings-card">
      <!-- 服务器配置 -->
      <div class="settings-section">
        <h3>服务器配置</h3>
        <div class="form-group">
          <label>服务器端口</label>
          <input type="number" v-model.trim="settings.port" class="form-input" placeholder="服务器端口">
          <small class="form-hint">修改后需要重启服务器生效</small>
        </div>
      </div>

      <!-- 管理员配置 -->
      <div class="settings-section">
        <h3>管理员配置</h3>
        <div class="form-group">
          <label>管理员密码</label>
          <div class="input-with-button">
            <input :type="showPassword ? 'text' : 'password'" v-model.trim="settings.adminKey" class="form-input"
              placeholder="管理员密码">
            <button class="btn-icon" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Tron配置 -->
      <div class="settings-section">
        <h3>Tron配置</h3>
        <div class="form-group">
          <label>收款钱包地址 TRC20</label>
          <input type="text" v-model.trim="settings.walletAddress" class="form-input usdtinput" placeholder="USDT钱包地址">
        </div>
        <div class="form-group">
          <label>API Key <small class="form-hint"><a href="https://www.trongrid.io/"
                target="_blank">前往申请</a></small></label>
          <input type="text" v-model.trim="settings.apiKey" class="form-input apikeyinput"
            placeholder="TRON Grid API Key">
        </div>
        <div class="form-group">
          <label>节点地址<small class="form-hint">不懂不要乱改</small></label>
          <input type="text" v-model.trim="settings.fullHost" class="form-input" placeholder="TRON节点地址">
        </div>
        <div class="form-group">
          <label>合约地址<small class="form-hint">不懂不要乱改</small></label>
          <input type="text" v-model.trim="settings.contractAddress" class="form-input" placeholder="USDT合约地址">
        </div>
      </div>

      <!-- 订单配置 -->
      <div class="settings-section">
        <h3>订单配置</h3>
        <div class="form-group">
          <label>订单过期时间(分钟)</label>
          <input type="number" v-model.trim="settings.expirationTime" class="form-input" placeholder="订单过期时间">
          <small class="form-hint">订单创建后的有效时间</small>
        </div>
      </div>

      <!-- 数据保存配置 -->
      <div class="settings-section">
        <h3>数据保存配置</h3>
        <div class="form-group">
          <label>数据保存间隔(分钟)</label>
          <input type="number" v-model.trim="settings.dataSaveInterval" class="form-input" placeholder="数据保存间隔">
          <small class="form-hint">系统自动保存数据的时间间隔</small>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn-primary" @click="saveSettings">保存设置</button>
        <button class="btn-secondary" @click="resetSettings">撤回</button>
      </div>
    </div>

    <!-- 模态框 -->
    <ModalDialog :show="showModal" :title="modalTitle" :modal-type="modalType" @close="closeModal"
      @submit="submitModal">
      <!-- 确认修改系统设置 -->
      <div v-if="modalType === 'confirmSettings'" class="modal-form">
        <div class="warning-message">
          <i class="ri-alert-line"></i>
          <p>您正在修改系统关键设置，这可能会影响系统的正常运行。请确认您了解所做的更改并确认继续。</p>
        </div>
        <div class="settings-summary">
          <h3>即将修改的设置:</h3>
          <!-- 服务器配置 -->
          <div class="detail-group" v-if="settings.port !== originalSettings.port">
            <span class="detail-label">服务器端口:</span>
            <span class="detail-value">{{ settings.port }}</span>
          </div>
          <div class="detail-group" v-if="settings.jwtSecret !== originalSettings.jwtSecret">
            <span class="detail-label">JWT密钥:</span>
            <span class="detail-value">已修改</span>
          </div>

          <!-- 管理员配置 -->
          <div class="detail-group" v-if="settings.adminKey !== originalSettings.adminKey">
            <span class="detail-label">管理员密码:</span>
            <span class="detail-value">已修改</span>
          </div>

          <!-- Tron配置 -->
          <div class="detail-group" v-if="settings.walletAddress !== originalSettings.walletAddress">
            <span class="detail-label">钱包地址:</span>
            <span class="detail-value">{{ settings.walletAddress }}</span>
          </div>
          <div class="detail-group" v-if="settings.fullHost !== originalSettings.fullHost">
            <span class="detail-label">节点地址:</span>
            <span class="detail-value">{{ settings.fullHost }}</span>
          </div>
          <div class="detail-group" v-if="settings.privateKey !== originalSettings.privateKey">
            <span class="detail-label">私钥:</span>
            <span class="detail-value">已修改</span>
          </div>
          <div class="detail-group" v-if="settings.contractAddress !== originalSettings.contractAddress">
            <span class="detail-label">合约地址:</span>
            <span class="detail-value">{{ settings.contractAddress }}</span>
          </div>
          <div class="detail-group" v-if="settings.apiKey !== originalSettings.apiKey">
            <span class="detail-label">API Key:</span>
            <span class="detail-value">已修改</span>
          </div>

          <!-- 订单配置 -->
          <div class="detail-group" v-if="settings.pollingTime !== originalSettings.pollingTime">
            <span class="detail-label">轮询时间:</span>
            <span class="detail-value">{{ settings.pollingTime }} 秒</span>
          </div>
          <div class="detail-group" v-if="settings.expirationTime !== originalSettings.expirationTime">
            <span class="detail-label">过期时间:</span>
            <span class="detail-value">{{ settings.expirationTime }} 分钟</span>
          </div>
          <div class="detail-group" v-if="settings.requiredConfirmations !== originalSettings.requiredConfirmations">
            <span class="detail-label">交易确认数:</span>
            <span class="detail-value">{{ settings.requiredConfirmations }}</span>
          </div>
          <div class="detail-group" v-if="settings.checkTimeWindow !== originalSettings.checkTimeWindow">
            <span class="detail-label">交易检查时间窗口:</span>
            <span class="detail-value">{{ settings.checkTimeWindow }} 分钟</span>
          </div>
          <div class="detail-group" v-if="settings.randomDecimalMin !== originalSettings.randomDecimalMin">
            <span class="detail-label">随机小数最小值:</span>
            <span class="detail-value">{{ settings.randomDecimalMin }}</span>
          </div>
          <div class="detail-group" v-if="settings.randomDecimalMax !== originalSettings.randomDecimalMax">
            <span class="detail-label">随机小数最大值:</span>
            <span class="detail-value">{{ settings.randomDecimalMax }}</span>
          </div>
          <div class="detail-group"
            v-if="settings.maxPendingOrdersPerDevice !== originalSettings.maxPendingOrdersPerDevice">
            <span class="detail-label">每设备最大待处理订单数:</span>
            <span class="detail-value">{{ settings.maxPendingOrdersPerDevice }}</span>
          </div>
          <div class="detail-group" v-if="settings.orderCreationCooldown !== originalSettings.orderCreationCooldown">
            <span class="detail-label">订单创建冷却时间:</span>
            <span class="detail-value">{{ settings.orderCreationCooldown }} 分钟</span>
          </div>
          <div class="detail-group"
            v-if="settings.maxOrdersInCooldownPeriod !== originalSettings.maxOrdersInCooldownPeriod">
            <span class="detail-label">冷却期内最大订单数:</span>
            <span class="detail-value">{{ settings.maxOrdersInCooldownPeriod }}</span>
          </div>

          <!-- 数据保存配置 -->
          <div class="detail-group" v-if="settings.dataSaveInterval !== originalSettings.dataSaveInterval">
            <span class="detail-label">数据保存间隔:</span>
            <span class="detail-value">{{ settings.dataSaveInterval }} 分钟</span>
          </div>

          <div class="no-changes-message" v-if="JSON.stringify(settings) === JSON.stringify(originalSettings)">
            <p>没有检测到设置变更</p>
          </div>
        </div>
      </div>
    </ModalDialog>
  </div>
</template>

<style lang="less" scoped>
// @import '../styles/components.less';</style>
