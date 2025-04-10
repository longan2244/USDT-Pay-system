import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  base: '/admin',
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.31.160:9998',
        changeOrigin: true,
        // 删除 rewrite 配置，保留原始路径
      }
    }
  }
})
