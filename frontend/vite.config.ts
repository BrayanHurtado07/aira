import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Separa dependencias grandes en chunks propios: el bundle principal no
        // crece con todo junto y mejora caché + carga inicial.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          datos: ['@tanstack/react-query', 'zustand'],
          animacion: ['motion'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
    },
  },
});
