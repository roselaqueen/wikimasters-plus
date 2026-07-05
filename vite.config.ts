import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/wm-api': {
        target: 'https://www.wiki-masters.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/wm-api/, '/api'),
      },
    },
  },
})
