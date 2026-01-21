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

  // Disable esbuild during config loading to prevent EPIPE
  esbuild: {
    tsconfigRaw: {},
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
    // IMPORTANT: Proxy target must be the backend server (port 3000), not PUBLIC_API_URL
    // PUBLIC_API_URL is for client-side fetch calls to be same-origin
    // Backend server runs on SERVER_PORT (default: 3000)
    proxy: {
      '/api': {
        target: process.env.SERVER_URL || `http://localhost:${process.env.SERVER_PORT || 3000}`,
        changeOrigin: true,
        secure: false,
        ws: true,
        // Ensure cookies are properly forwarded
        configure: (proxy, _options) => {
          // Proxy configuration - cookies automatically forwarded
        },
      },
      '/rpc': {
        target: process.env.SERVER_URL || `http://localhost:${process.env.SERVER_PORT || 3000}`,
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          // Proxy configuration - cookies automatically forwarded
        },
      },
    },
  },
});
