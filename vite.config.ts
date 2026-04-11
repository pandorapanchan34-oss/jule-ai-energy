import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // root設定を削除（プロジェクトルートのindex.htmlを使用）
  plugins: [react()],
  base: '/jule-ai-energy/',
  build: {
    // プロジェクトルートのdistに出力
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    rollupOptions: {
      input: 'index.html'
    }
  }
})
