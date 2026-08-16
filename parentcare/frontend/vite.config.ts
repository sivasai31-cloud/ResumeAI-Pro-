import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const keyPath = path.resolve(__dirname, 'certs/localhost-key.pem')
const certPath = path.resolve(__dirname, 'certs/localhost.pem')
const hasHttpsCerts = fs.existsSync(keyPath) && fs.existsSync(certPath)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    https: hasHttpsCerts
      ? {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        }
      : undefined,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../backend/static/dist'),
    emptyOutDir: true,
  },
})
