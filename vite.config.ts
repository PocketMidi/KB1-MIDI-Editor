import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/KB1-Config-Lab/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
