import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Запити /api/* з клієнта перенаправляються на Ruby-сервер
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4567' }
  }
});
