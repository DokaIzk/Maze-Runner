import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Point to your public directory as root
  root: 'public',
  
  // Where static assets are served from
  publicDir: 'assets',
  
  // Build configuration
  build: {
    target: 'esnext',
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'public/index.html'),
      },
    },
  },
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    
    // CRITICAL: Required headers for Linera WebAssembly
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },

    fs: {
      strict: false,
      allow: ['..'],
    }
  },
  
  // Preview server (for production build testing)
  preview: {
    port: 3000,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
  
  // Module resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './public/src'),
      '@linera': path.resolve(__dirname, './public/src/linera'),
      '@scenes': path.resolve(__dirname, './public/src/scenes'),
      '@utils': path.resolve(__dirname, './public/src/utils'),
      '@ui': path.resolve(__dirname, './public/src/ui'),
    },
    extensions: ['.js', '.ts', '.json', '.wasm'],
  },
  
  // Optimize dependencies
  optimizeDeps: {
    // Exclude Linera client from pre-bundling (it uses WebAssembly)
    exclude: ['@linera/client'],
    
    // Include Dynamic SDK for better performance
    include: ['@dynamic-labs/ethereum', '@dynamic-labs/sdk-api', 'viem', 'react', 'react-dom'],

    // ✅ ADDED: Force Vite to handle WASM properly
    esbuildOptions: {
      target: 'esnext',
    },
  },  

  worker: {
    format: 'es',
    plugins: () => [],
  },

  // Enable source maps for better debugging
  css: {
    devSourcemap: true,
  },

  define: {
    'process.env': {},
  },
});