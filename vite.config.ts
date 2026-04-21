import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import fs from "fs"

const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf-8"))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  build: {
    target: 'ES2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
      mangle: true,
      format: {
        comments: false,
      },
    } as any,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-slot', '@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-accordion'],
          'vendor-icons': ['@tabler/icons-react'],
          'vendor-utils': ['clsx', 'sonner'],
          'pages-main': ['./src/components/pages/welcome', './src/components/pages/help'],
          'pages-monitoring': ['./src/components/pages/monitoring', './src/components/pages/connector'],
          'pages-shares': ['./src/components/pages/shares'],
          'pages-files': ['./src/components/pages/files'],
          'pages-tasks': ['./src/components/pages/tasks'],
          'pages-users': ['./src/components/pages/users'],
          'pages-logs': ['./src/components/pages/logs'],
          'pages-settings': ['./src/components/pages/settings'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
