import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // index.htmlがあるフォルダを指定
  root: 'demo',
  
  // 公開設定
  base: './',

  build: {
    // 出力先を外側の dist フォルダに設定
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
  },

  resolve: {
    alias: {
      // ソースコード(src)へのパスを通す
      '@': resolve(__dirname, './src'),
    },
  },

  server: {
    port: 3000,
    host: true,
  }
});
