import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    assetsInlineLimit: 100000000,
    outDir: 'dist',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
      // Don't inline service worker and manifest
      external: ['/sw.js', '/register-sw.js', '/manifest.json']
    },
  },
  base: '/fitness-local-app/',
  publicDir: 'public',
});