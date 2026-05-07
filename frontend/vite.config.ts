import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
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
    },
  },
});
