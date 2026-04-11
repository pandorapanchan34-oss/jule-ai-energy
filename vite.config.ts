import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'demo', // ビルドの起点はdemoフォルダ
  plugins: [react()],
  base: '/jule-ai-energy/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: 'terser',
    rollupOptions: {
      // demo/index.html を起点にする
      input: 'index.html' 
    }
  }
})
