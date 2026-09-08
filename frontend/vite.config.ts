import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  envDir: '..',
  server: { proxy: { '/api': loadEnv(mode, '..', '').DEV_API_TARGET || 'http://127.0.0.1:8000' } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth'],
        },
      },
    },
  },
}))
