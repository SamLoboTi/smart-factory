import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/sensores': proxyTarget,
      '/kpis': proxyTarget,
      '/alertas': proxyTarget,
      '/assistant': proxyTarget,
      '/report': proxyTarget
    }
  }
})
