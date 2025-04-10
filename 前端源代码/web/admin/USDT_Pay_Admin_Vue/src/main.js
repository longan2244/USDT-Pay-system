import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

//全局
import NotificationPlugin from './plugins/notification'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(NotificationPlugin)

app.mount('#app')
