import axios from 'axios'
// 创建axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})
import { showNotification } from '@/util/notification'

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('adminToken')

    // 如果有token则添加到请求头
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data

    // 如果返回的状态码不是200，说明接口请求有误
    if (!res.success) {
      console.error('接口请求错误:', res.message || '未知错误')
      showNotification('error', '请求错误', res.message || '未知错误')
      return Promise.reject(new Error(res.message || '未知错误'))
    }

    return res
  },
  error => {
    // 提示错误信息
    if (error.response && error.response.data && error.response.data.message) {
      showNotification('error', '请求失败', error.response.data.message)
    } else if (error.message.includes('timeout')) {
      showNotification('error', '请求超时', '服务器响应超时，请检查网络连接')
    } else if (error.message.includes('Network Error')) {
      showNotification('error', '网络错误', '无法连接到服务器，请检查网络连接')
    } else {
      showNotification('error', '请求错误', error.message || '未知错误')
    }

    // 处理HTTP错误状态码
    if (error.response) {
      const status = error.response.status

      // 401: 未登录或token过期
      if (status === 401) {
        // 清除token并跳转到登录页
        localStorage.removeItem('adminToken')
        showNotification('warning', '登录已过期', '请重新登录')
        window.location.href = '/login'
      } else if (status === 403) {
        showNotification('error', '权限不足', '您没有权限执行此操作')
      } else if (status === 404) {
        showNotification('error', '资源不存在', '请求的资源不存在')
      } else if (status === 500) {
        showNotification('error', '服务器错误', '服务器内部错误，请稍后重试')
      }

      console.error(`请求失败，状态码: ${status}`, error.response.data)
    } else {
      console.error('请求失败:', error.message)
    }

    return Promise.reject(error)
  }
)

export default request
