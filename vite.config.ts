import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

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
    },
    cors: false,
  }
})
