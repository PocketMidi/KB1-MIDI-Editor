import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/KB1-MIDI-Editor/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
