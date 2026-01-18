import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file in root
dotenv.config({ path: resolve(__dirname, '../../.env') });

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],

  resolve: {
    alias: {
      $lib: path.resolve(__dirname, './src/lib'),
      $components: path.resolve(__dirname, './src/components'),
    },
  },

  ssr: {
    // No external - use default behavior
  },

  server: {
    // Listen on all interfaces for Docker compatibility
    host: '0.0.0.0',

    port: Number(process.env.WEB_PORT) || 5174,
    strictPort: false,

    // HMR configuration - let Vite auto-detect port from WebSocket handshake
    hmr: {
      protocol: 'ws',
    },

    // Watch options for file watching in Docker
    watch: {
      usePolling: true,
      interval: 1000,
      // Include more directories to watch
      ignored: ['!**/node_modules/.vite/**', '!**/.svelte-kit/**'],
    },

    // Proxy API requests to backend server (same-origin for cookies)
    proxy: {
      '/ai': {
        target: process.env.PUBLIC_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
        // Ensure cookies are properly forwarded
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            // Log original cookies for debugging
            const cookies = _req.headers['cookie'];
            console.log('[Vite Proxy /ai] Original cookies:', cookies?.substring(0, 100));
          });
          proxy.on('proxyRes', (proxyRes, _req, _res) => {
            // Log set-cookie headers for debugging
            const setCookie = proxyRes.headers['set-cookie'];
            if (setCookie) {
              console.log('[Vite Proxy /ai] Set-Cookie:', setCookie);
            }
          });
        },
      },
      '/rpc': {
        target: process.env.PUBLIC_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            const cookies = _req.headers['cookie'];
            console.log('[Vite Proxy /rpc] Original cookies:', cookies?.substring(0, 100));
          });
        },
      },
    },
  },
});
