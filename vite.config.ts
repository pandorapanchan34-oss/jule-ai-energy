import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // 1. 基本となるインポートの定義
  // ReferenceError: defineConfig is not defined を防ぐための根幹です。
  
  build: {
    outDir: 'dist',
    sourcemap: true, // デバッグとゆらぎの観測に役立ちます
    minify: 'terser', // 出力を最適化
  },

  resolve: {
    alias: {
      // 必要に応じてパスエイリアスを設定してください
      '@': resolve(__dirname, './src'),
    },
  },

  // サーバー設定（ローカル開発用）
  server: {
    port: 3000,
    strictPort: true,
  }
});
