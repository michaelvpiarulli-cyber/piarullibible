import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Same path Vercel rewrites in production — keeps Subsplash CORS off our plate.
      '/api/subsplash': {
        target: 'https://notes.subsplash.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/subsplash/, '/fill-in/api'),
      },
    },
  },
  preview: {
    proxy: {
      '/api/subsplash': {
        target: 'https://notes.subsplash.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/subsplash/, '/fill-in/api'),
      },
    },
  },
});
