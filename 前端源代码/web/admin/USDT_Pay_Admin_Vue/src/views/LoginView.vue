<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login as loginApi } from '../api/auth'

import { getSettings } from '../api/settings'

import LoadingSpinner from '../components/LoadingSpinner.vue'

const router = useRouter()

const loginForm = ref({
  adminKey: ''
})

const isLoading = ref(false)
const errorMessage = ref('')

import { useNotification } from '../composables/useNotification'

const { showNotification } = useNotification()

const login = async () => {
  if (!loginForm.value.adminKey) {
    errorMessage.value = '请输入管理员密钥'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    const response = await loginApi({
      adminKey: loginForm.value.adminKey
    })

    // 由于在request.js中已经处理了响应拦截，这里直接使用返回的数据
    const token = response.data.token
    localStorage.setItem('adminToken', token)

    // 检查关键设置
    const { data } = await getSettings()

    // 登录成功通知
    showNotification('success', '登录成功', '欢迎使用USDT收款系统')

    // 如果缺少关键设置，跳转到设置页面
    if (!data.apiKey || !data.walletAddress) {
      showNotification('warning', '系统配置不完整', '请先完成钱包地址和API密钥的配置', 5000)
      // 强制刷新页面以确保导航状态正确更新
      localStorage.setItem('redirectToSettings', 'true')
      router.push('/settings').then(() => {
        router.go(0)
      })
    } else {
      router.push('/dashboard')
    }

  } catch (error) {
    console.error('登录失败:', error)
    errorMessage.value = error.response?.data?.message || '管理员密钥错误'
    showNotification('error', '登录失败', error.response?.data?.message || '管理员密钥错误')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <LoadingSpinner :is-loading="isLoading" />

    <div class="login-card">
      <div class="login-header">
        <i class="ri-currency-line"></i>
        <h1>USDT收款系统</h1>
      </div>
      <div class="login-form">
        <div class="form-group">
          <label>管理员登录密码</label>
          <input type="password" autocomplete="off" v-model.trim="loginForm.adminKey" class="form-input"
            placeholder="请输入管理员密码" @keyup.enter="login">
          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </div>
        <div class="form-actions">
          <button class="btn-primary btn-block" @click="login">登录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
// @import '../styles/components.less';

.error-message {
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}
</style>
