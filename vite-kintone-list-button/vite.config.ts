import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

/**
 * kintone 用に IIFE を 1 ファイルへまとめる。
 * - 本番ビルド: `desktop.bundle.js`（Tailwind は vite-plugin-css-injected-by-js で JS に同梱）
 * - `npm run dev`: index.html 前提の通常サーバ（input の指定はビルド時のみ）
 */
export default defineConfig(({ command }) => ({
  plugins: [react(), ...(command === 'build' ? [cssInjectedByJsPlugin()] : [])],
  ...(command === 'build'
    ? {
        build: {
          outDir: 'dist',
          emptyOutDir: true,
          sourcemap: true,
          rollupOptions: {
            // メインは Cursor が用意した一覧マウント用エントリ
            input: './src/main.tsx',
            output: {
              format: 'iife',
              // IIFE のグローバル名（未使用でも Rollup が求めることがある）
              name: 'KintoneListButtonCustom',
              entryFileNames: 'desktop.bundle.js',
              inlineDynamicImports: true,
            },
          },
        },
      }
    : {}),
}));
