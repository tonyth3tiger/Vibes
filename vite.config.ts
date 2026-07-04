import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Dev-only proxies for the Polymarket public APIs so the insider
        // dashboard is immune to CORS policy; prod builds hit hosts directly.
        proxy: {
          '/api/gamma': {
            target: 'https://gamma-api.polymarket.com',
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/api\/gamma/, ''),
          },
          '/api/data': {
            target: 'https://data-api.polymarket.com',
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/api\/data/, ''),
          },
          '/api/clob': {
            target: 'https://clob.polymarket.com',
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/api\/clob/, ''),
          },
        },
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
