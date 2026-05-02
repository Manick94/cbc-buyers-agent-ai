import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ['@huggingface/transformers', '@mediapipe/tasks-genai'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/models': 'http://localhost:3001',
    },
  },
})
