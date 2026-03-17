import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
    define: {
    global: 'window',
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://back.devpoticard.kro.kr:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },

      '/ws': {
        target: 'http://back.devpoticard.kro.kr:8080',
        ws: true,
        changeOrigin: true,
      },

      '/chat-ws': {
        target: 'ws://back.devpoticard.kro.kr:8080',
        ws: true,
        changeOrigin: true,
      },
      '/json': { target: 'http://back.devpoticard.kro.kr:8080', changeOrigin: true },
    },
    allowedHosts : ['front.devpoticard.kro.kr']
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
