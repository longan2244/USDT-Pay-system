// 通知插件
import { showNotification, closeNotification } from '../util/notification'

export default {
  install: (app) => {
    // 将通知方法添加到全局属性中
    app.config.globalProperties.$notification = {
      show: showNotification,
      close: closeNotification
    }
  }
}
