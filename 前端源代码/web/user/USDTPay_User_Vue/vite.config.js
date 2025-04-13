import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import postcssPxtorem from 'postcss-pxtorem'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  css: {
    postcss: {
      plugins: [
        // postcssPxtorem({
        //   rootValue: 37.5,
        //   propList: ['*'],
        //   selectorBlackList: ['norem']
        // })
      ]
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'element-plus',
      'vue-clipboard3',
      'bootstrap'
    ]
  },
  build: {
    assetsInlineLimit: 40960000,
    minify: true,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url))
      }
    }
  },
  // base: '/static',

  //添加代理
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:9998',
        changeOrigin: true,
        // 删除 rewrite 配置，保留原始路径
      }
    }
  }
  // base: '/W6CpLT'
})
