import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { config } from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'


const here = dirname(fileURLToPath(import.meta.url))
const inspect = resolve(here, '../lcp_inspect/dist/index.js')

config()

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [svelte(), ...(existsSync(inspect) ? [(await import(inspect)).default()] : [])],
  resolve: {
    alias: {
      '$lib': resolve(here, 'src/lib'),
      '$components': resolve(here, 'src/components'),
      '$character-sheet': resolve(here, 'src/components/character_sheet'),
      '$dialogs': resolve(here, 'src/components/dialogs'),
      '$chat': resolve(here, 'src/components/chat'),
      '$pages': resolve(here, 'src/pages')
    }
  },
  server: {
    proxy: {
      "/replicate": {
        target: "https://api.replicate.com/v1",
        changeOrigin: true,
        secure: false,
        rewrite: (p: string) => p.replace(/^\/replicate/, ""),
      }
    },
    cors: false,
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  build: {
    rollupOptions: {
      external: []
    }
  }
}))
