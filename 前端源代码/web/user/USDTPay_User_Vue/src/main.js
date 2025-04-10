// import 'amfe-flexible'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/base.less'
import 'bootstrap/dist/css/bootstrap.min.css'
import './assets/dark-theme.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
