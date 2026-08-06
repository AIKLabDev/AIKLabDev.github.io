import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // 조직 사이트(AIKLabDev.github.io) 루트. 프로젝트 페이지로 바뀌면 '/레포명/'
  base: '/',

  server: {
    host: true,
    port: 7777,
    strictPort: true,
  },

  preview: {
    host: true,
    port: 7777,
    strictPort: true,
  },
})
