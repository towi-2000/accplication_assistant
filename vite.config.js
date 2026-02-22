import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import apiApp from './server/index.js'

const apiPlugin = {
  name: 'api-middleware',
  apply: 'serve',
  configureServer(server) {
    return () => {
      // Unified Mode: Verwende die komplette Express App als Middleware
      // Nur wenn nicht im Standalone-Mode (d.h. Server läuft nicht auf 5174)
      server.middlewares.use(apiApp)
    }
  }
}

// Optional Proxy für Standalone Mode (wenn separate Server auf 5174 läuft)
const proxyConfig = {
  '/api': {
    target: 'http://localhost:5174',
    changeOrigin: true,
    secure: false
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin],
  server: {
    port: 5173,
    host: '127.0.0.1',
    proxy: process.env.VITE_API_PROXY === 'true' ? proxyConfig : undefined
  }
})
