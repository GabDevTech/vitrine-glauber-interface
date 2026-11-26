import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'

export default defineConfig({
  plugins: [
    vue({ template: { transformAssetUrls } }),
    quasar({ autoImportComponentCase: 'kebab' }),
  ],
  server: {
    host: '0.0.0.0',
    port: 4180,
    proxy: {
      '/api/v1': 'http://127.0.0.1:3000',
    },
  },
})
