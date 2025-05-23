import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { config } from 'dotenv'

declare const process: {
  env: {
    REPLICATE_API_KEY: string | undefined
  }
}

config()

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    proxy: {
      "/replicate": {
        target: "https://api.replicate.com/v1",
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/replicate/, ""),
      },
      "/anthropic": {
        target: "https://api.anthropic.com/v1",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/anthropic/, ""),
      },
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
