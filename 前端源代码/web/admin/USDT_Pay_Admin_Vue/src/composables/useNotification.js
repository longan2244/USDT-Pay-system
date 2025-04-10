// 通知组合式API
import { getCurrentInstance } from 'vue'
import { useNotification as useGlobalNotification } from '../util/notification'

/**
 * 使用通知的组合式API
 * 可以在组件中使用 const { showNotification } = useNotification() 来获取通知方法
 * 也可以在组件外部使用 import { showNotification } from '@/util/notification' 来获取通知方法
 */
export function useNotification() {
  // 获取当前组件实例
  const instance = getCurrentInstance()
  
  // 如果在组件中使用，优先使用全局属性
  if (instance) {
    const { $notification } = instance.appContext.config.globalProperties
    return {
      showNotification: $notification.show,
      closeNotification: $notification.close
    }
  }
  
  // 如果在组件外部使用，使用全局状态
  return useGlobalNotification()
}
