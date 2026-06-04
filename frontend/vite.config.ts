import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:3002'
const allowedHosts = [
  'localhost',
  '127.0.0.1',
  ...(process.env.VITE_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean),
]

if (process.env.VITE_ENABLE_TUNNEL === 'true') {
  allowedHosts.push('.trycloudflare.com')
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts,
    proxy: {
      '/sensores': proxyTarget,
      '/kpis': proxyTarget,
      '/alertas': proxyTarget,
      '/assistant': proxyTarget,
      '/report': proxyTarget,
      '/notifications': proxyTarget
    }
  }
})
