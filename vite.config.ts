import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'demo',        // ← demo/を起点に
  build: {
    outDir: '../dist-demo',  // ← ルートからの相対パス
  },
  base: '/jule-ai-energy/',
});
