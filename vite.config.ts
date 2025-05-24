import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { config } from 'dotenv'
import { resolve } from 'path'

declare const process: {
  env: {
    REPLICATE_API_KEY: string | undefined
  }
}

config()

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '$lib': resolve(__dirname, 'src/lib'),
      '$components': resolve(__dirname, 'src/components'),
      '$character-sheet': resolve(__dirname, 'src/components/character_sheet'),
      '$dialogs': resolve(__dirname, 'src/components/dialogs'),
      '$chat': resolve(__dirname, 'src/components/chat'),
      '$pages': resolve(__dirname, 'src/pages')
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
