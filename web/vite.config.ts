import { defineConfig, type Plugin } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { config } from 'dotenv'
import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, rename, stat, unlink } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { dirname, extname, resolve, sep } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import lcpInspect from '@slyotis/lcp-inspect'


const here = dirname(fileURLToPath(import.meta.url))

config({ path: resolve(here, '..', '.env') })

const MEDIA_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.weba': 'audio/webm',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mov': 'video/quicktime',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8'
}

const mediaTags = new Map<string, { stamp: string; etag: string }>()

async function getMediaTag(file: string, size: number, mtime: number): Promise<string> {
  const stamp = `${size}:${mtime}`
  const held = mediaTags.get(file)
  if (held?.stamp === stamp) return held.etag

  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk)

  const etag = `"${hash.digest('base64url')}"`
  mediaTags.set(file, { stamp, etag })
  return etag
}

function isFresh(header: string | undefined, etag: string): boolean {
  if (!header) return false
  return header
    .split(',')
    .map((one) => one.trim().replace(/^W\//, ''))
    .some((one) => one === '*' || one === etag)
}

export function getMediaRange(header: string | undefined, size: number): { start: number; end: number } | 'bad' | null {
  if (!header) return null

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (!match) return header.includes(',') ? null : 'bad'

  const [, first, last] = match
  if (!first && !last) return 'bad'
  if (size === 0) return 'bad'

  if (!first) {
    const length = Number(last)
    return length ? { start: Math.max(0, size - length), end: size - 1 } : 'bad'
  }

  const start = Number(first)
  const end = last ? Math.min(Number(last), size - 1) : size - 1
  return start >= size || end < start ? 'bad' : { start, end }
}

export function getMediaHandler(root: string): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  const base = resolve(root)

  return async (req, res) => {
    res.setHeader('X-Media-Store', '1')

    try {
      const path = decodeURIComponent((req.url ?? '').split('?')[0]).replace(/^\/+/, '')
      const file = resolve(base, path)

      if (!path || !file.startsWith(base + sep)) {
        res.statusCode = 403
        res.end()
        return
      }

      if (req.method === 'PUT') {
        await mkdir(dirname(file), { recursive: true })
        const created = !(await stat(file).catch(() => null))
        const part = `${file}.${process.pid}.${Date.now()}.part`
        const hash = createHash('sha256')

        await pipeline(
          req,
          async function* (source: AsyncIterable<Buffer>) {
            for await (const chunk of source) {
              hash.update(chunk)
              yield chunk
            }
          },
          createWriteStream(part)
        ).catch(async (reason) => {
          await unlink(part).catch(() => undefined)
          throw reason
        })

        await rename(part, file)
        const written = await stat(file)
        const etag = `"${hash.digest('base64url')}"`
        mediaTags.set(file, { stamp: `${written.size}:${written.mtimeMs}`, etag })

        res.statusCode = created ? 201 : 204
        res.setHeader('ETag', etag)
        res.end()
        return
      }

      if (req.method === 'DELETE') {
        await unlink(file)
        mediaTags.delete(file)
        res.statusCode = 204
        res.end()
        return
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.statusCode = 405
        res.setHeader('Allow', 'GET, HEAD, PUT, DELETE')
        res.end()
        return
      }

      const held = await stat(file).catch(() => null)
      if (!held?.isFile()) {
        res.statusCode = req.method === 'HEAD' && req.headers['x-media-probe'] ? 204 : 404
        res.end()
        return
      }

      const etag = await getMediaTag(file, held.size, held.mtimeMs)
      res.setHeader('ETag', etag)
      res.setHeader('Accept-Ranges', 'bytes')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Content-Type', MEDIA_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream')

      if (isFresh(req.headers['if-none-match'], etag)) {
        res.statusCode = 304
        res.end()
        return
      }

      const range = getMediaRange(req.headers.range, held.size)
      if (range === 'bad') {
        res.statusCode = 416
        res.setHeader('Content-Range', `bytes */${held.size}`)
        res.end()
        return
      }

      const { start, end } = range ?? { start: 0, end: held.size - 1 }
      res.statusCode = range ? 206 : 200
      if (range) res.setHeader('Content-Range', `bytes ${start}-${end}/${held.size}`)
      res.setHeader('Content-Length', String(end - start + 1))

      if (req.method === 'HEAD' || end < start) {
        res.end()
        return
      }

      await pipeline(createReadStream(file, { start, end }), res)
    } catch (reason) {
      if (res.headersSent) {
        res.destroy()
        return
      }
      const code = (reason as NodeJS.ErrnoException).code
      res.statusCode = code === 'ENOENT' ? 404 : reason instanceof URIError ? 400 : 500
      res.end()
    }
  }
}

function mediaStore(root: string): Plugin {
  return {
    name: 'media-store',
    configureServer(server) {
      server.middlewares.use('/media', getMediaHandler(root))
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), mediaStore(resolve(here, 'media')), lcpInspect()],
  envDir: resolve(here, '..'),
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
      "/api": {
        target: `http://localhost:${process.env.SERVER_PORT ?? '4290'}`,
        changeOrigin: false
      },
      "/replicate": {
        target: "https://api.replicate.com/v1",
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/replicate/, ""),
      }
    },
    cors: false,
    watch: {
      ignored: [resolve(here, 'media') + '/**']
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'yjs', 'mermaid']
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      external: []
    }
  }
})
