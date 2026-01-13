import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'path';

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
    port: 5173,
    strictPort: true,
    // HMR configuration for Docker
    hmr: {
      clientPort: 5173,
    },
    // Watch options for file watching in Docker
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
});
