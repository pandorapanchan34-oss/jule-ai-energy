import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // 1. エントリポイント(index.html)の場所を指定
  root: 'demo',

  build: {
    // 2. 出力先をプロジェクトルートの dist に設定
    outDir: '../dist',
    // 出力ディレクトリを空にする設定（rootを変更しているため必要）
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
  },

  resolve: {
    alias: {
      // ソースコードへのエイリアス設定
      '@': resolve(__dirname, './src'),
    },
  },

  // サーバー設定（開発用）
  server: {
    port: 3000,
    strictPort: true,
  }
});
