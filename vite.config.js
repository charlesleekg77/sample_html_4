import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { markdownAndApi } from './src/lib/mdServer.js'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  // Set by the Pages workflow; empty in local dev so the site serves from "/".
  base: process.env.VITE_BASE || '/',
  plugins: [vue(), markdownAndApi(root)],
  server: {
    host: '0.0.0.0',
    port: 12000,
    strictPort: false,
    allowedHosts: true,
    hmr: { clientPort: 443 },
  },
  preview: {
    host: '0.0.0.0',
    port: 12000,
    strictPort: false,
    allowedHosts: true,
  },
})
