import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))
const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
  root: projectRoot,
  base: '/gestao/',
  publicDir: fileURLToPath(new URL('../public', import.meta.url)),
  plugins: [
    vue({ template: { transformAssetUrls } }),
    quasar({ autoImportComponentCase: 'kebab' }),
  ],
  server: {
    host: '0.0.0.0',
    port: 4175,
    strictPort: true,
    fs: { allow: [repositoryRoot] },
  },
  preview: { host: '0.0.0.0', port: 4175 },
})
