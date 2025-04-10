import { ElMessage } from 'element-plus'
import 'element-plus/theme-chalk/el-message.css'

const MessageBox = {
  success(message) {
    ElMessage({
      message,
      type: 'success',
      duration: 3000,
      showClose: true,
      customClass: 'custom-message custom-message-success'
    })
  },

  warning(message) {
    ElMessage({
      message,
      type: 'warning',
      duration: 3000,
      showClose: true,
      customClass: 'custom-message custom-message-warning'
    })
  },

  error(message) {
    ElMessage({
      message,
      type: 'error',
      duration: 3000,
      showClose: true,
      customClass: 'custom-message custom-message-error'
    })
  },

  info(message) {
    ElMessage({
      message,
      type: 'info',
      duration: 3000,
      showClose: true,
      customClass: 'custom-message custom-message-info'
    })
  }
}

export default MessageBox