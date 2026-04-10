import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/jule-ai-energy/', // ← リポジトリ名に合わせる（超重要）
  build: {
    outDir: 'dist'
  }
})
