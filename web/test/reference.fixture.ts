import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export const races = (JSON.parse(readFileSync(resolve(root, 'public/sources/races/index.json'), 'utf8')) as { races: string[] }).races

export const speciesSlugs = races.map((id, index) => `${index + 1}-${id}`)

export const classSlugs = ['12-barbarian', '13-bard']

export const marketplaceSlug = '2175512-warforged'

export const missingSlug = '2175513-manikin'

export const magic = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const title = (slug: string) => slug.replace(/^\d+-/, '').split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('-')

export const listing = (path: string, slugs: string[]) => `<!doctype html>
<html>
<head><title>Listing - D and D Beyond</title></head>
<body>
<div class="listing-container">
${slugs.map((slug) => `<li><a href="/${path}/${slug}">${title(slug)}</a></li>`).join('\n')}
</div>
</body>
</html>
`

export const detail = (slug: string) => `<!doctype html>
<html>
<head><title>${title(slug)} - D and D Beyond</title></head>
<body>
<div class="static-container-details">
<div class="content-container">
<h1>${title(slug)}</h1>
<p>The ${title(slug)} description paragraph the 2014 page carries.</p>
<img src="/avatars/thumbnails/${slug}.png" alt="${title(slug)}">
<h2>${title(slug)} Traits</h2>
<h4>Darkvision</h4>
<p>You see in dim light within 60 feet as if it were bright light.</p>
<h4>Keen Senses</h4>
<p>You have proficiency in the Perception skill.</p>
<h2>Variant ${title(slug)}</h2>
<h4>Cantrip</h4>
<p>You know one cantrip of your choice from the wizard spell list.</p>
</div>
<div class="p-comments">Comments</div>
</div>
</body>
</html>
`

export const marketplace = `<!doctype html>
<html>
<head><title>Marketplace - D and D Beyond</title></head>
<body>
<div class="marketplace-container">
<p>This species is sold as part of a digital book.</p>
</div>
</body>
</html>
`

export const portrait = (slug: string) => Uint8Array.from([...magic, ...Buffer.from(slug)])

export const pages = (path: string, slugs: string[]) => {
  const map: Record<string, string | Uint8Array> = {}
  map[path] = listing(path, [...slugs, marketplaceSlug, missingSlug])
  map[`${path}/${marketplaceSlug}`] = marketplace
  for (const slug of slugs) {
    map[`${path}/${slug}`] = detail(slug)
    map[`avatars/thumbnails/${slug}.png`] = portrait(slug)
  }
  return map
}

const curl = `#!/usr/bin/env bash
out=""
code=0
url=""
while [ $# -gt 0 ]; do
  case "$1" in
    -o) out="$2"; shift 2 ;;
    -w) code=1; shift 2 ;;
    -A) shift 2 ;;
    -*) shift ;;
    *) url="$1"; shift ;;
  esac
done
printf '%s\\n' "$url" >> "$REFERENCE_LOG"
file="$REFERENCE_PAGES/$(printf '%s' "\${url#https://www.dndbeyond.com/}" | tr '/' '_')"
if [ -f "$file" ]; then
  cat "$file" > "$out"
  [ "$code" = 1 ] && printf '200'
else
  : > "$out"
  [ "$code" = 1 ] && printf '404'
fi
exit 0
`

const idle = `#!/usr/bin/env bash
exit 0
`

export type Run = { status: number, out: string }

export type Sandbox = {
  dir: string
  run: (...args: string[]) => Run
  requests: () => string[]
  folders: (kind: string) => string[]
  files: (kind: string, slug: string) => string[]
  read: (kind: string, slug: string, name: string) => string
  bytes: (kind: string, slug: string, name: string) => Uint8Array
  has: (kind: string) => boolean
}

export const sandbox = (map: Record<string, string | Uint8Array>): Sandbox => {
  const dir = mkdtempSync(join(tmpdir(), 'reference-'))
  mkdirSync(join(dir, 'scripts'))
  mkdirSync(join(dir, 'pages'))
  mkdirSync(join(dir, 'bin'))
  copyFileSync(resolve(root, 'scripts/reference.sh'), join(dir, 'scripts/reference.sh'))
  writeFileSync(join(dir, 'bin/curl'), curl, { mode: 0o755 })
  writeFileSync(join(dir, 'bin/sleep'), idle, { mode: 0o755 })
  for (const [path, body] of Object.entries(map)) writeFileSync(join(dir, 'pages', path.replace(/\//g, '_')), body)

  const log = join(dir, 'requests.log')
  const under = (kind: string) => join(dir, 'reference/dndbeyond', kind)

  return {
    dir,
    run: (...args: string[]) => {
      const done = spawnSync('bash', ['scripts/reference.sh', ...args], {
        cwd: dir,
        encoding: 'utf8',
        env: { ...process.env, PATH: `${join(dir, 'bin')}:${process.env.PATH}`, REFERENCE_PAGES: join(dir, 'pages'), REFERENCE_LOG: log }
      })
      return { status: done.status ?? -1, out: `${done.stdout ?? ''}${done.stderr ?? ''}` }
    },
    requests: () => {
      try {
        return readFileSync(log, 'utf8').split('\n').filter(Boolean)
      } catch {
        return []
      }
    },
    folders: (kind: string) => {
      try {
        return readdirSync(under(kind)).sort()
      } catch {
        return []
      }
    },
    files: (kind: string, slug: string) => readdirSync(join(under(kind), slug)).sort(),
    read: (kind: string, slug: string, name: string) => readFileSync(join(under(kind), slug, name), 'utf8'),
    bytes: (kind: string, slug: string, name: string) => Uint8Array.from(readFileSync(join(under(kind), slug, name))),
    has: (kind: string) => {
      try {
        readdirSync(under(kind))
        return true
      } catch {
        return false
      }
    }
  }
}
