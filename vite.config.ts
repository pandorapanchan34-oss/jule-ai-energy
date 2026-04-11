import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'demo',
  build: {
    outDir: '../dist-demo',
    emptyOutDir: true,        // ← 追加
  },
  base: '/jule-ai-energy/',
});
