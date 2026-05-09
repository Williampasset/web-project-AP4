import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Warehouse App',
        short_name: 'Warehouse',
        theme_color: '#ffffff',
      },
    }),
  ],
  resolve: {
    alias: {
      '@component': path.resolve(__dirname, './src/component'),
      '@type': path.resolve(__dirname, './src/type'),
      '@data': path.resolve(__dirname, './src/data'),
      '@service': path.resolve(__dirname, './src/service'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
});
