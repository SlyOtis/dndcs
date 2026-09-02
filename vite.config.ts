import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { config } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'


const here = dirname(fileURLToPath(import.meta.url))

config()

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
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
        rewrite: (p) => p.replace(/^\/replicate/, ""),
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
})
