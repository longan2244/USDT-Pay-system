// 全局通知服务
import { ref } from 'vue'

// 创建一个响应式的通知状态对象
const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: '',
  duration: 3000
})

// 显示通知的方法
export function showNotification(type, title, message, duration = 3000) {
  notification.value = {
    show: true,
    type,
    title,
    message,
    duration
  }
}

// 关闭通知的方法
export function closeNotification() {
  notification.value.show = false
}

// 导出通知状态，供组件使用
export function useNotification() {
  return {
    notification,
    showNotification,
    closeNotification
  }
}
