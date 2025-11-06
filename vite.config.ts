import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    rollupOptions: {
      external: ['better-sqlite3', 'electron-store'],
    }
  },
  server: {
    port: 5173,
  },
})
