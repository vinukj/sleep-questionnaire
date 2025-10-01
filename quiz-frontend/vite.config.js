import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
   plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "@emotion/react", "@emotion/styled"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@emotion/react", "@emotion/styled"],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/questionnaire': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/about': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/quizzes': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
