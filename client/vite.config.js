import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // React rarely changes, so a separate file stays in the browser cache across releases.
        manualChunks: { react: ['react', 'react-dom', 'react-router-dom'] },
      },
    },
  },
  server: {
    port: 5173,
    // In development the API runs separately; proxying keeps the session cookie same-origin.
    proxy: { '/api': 'http://localhost:5050' },
  },
});
