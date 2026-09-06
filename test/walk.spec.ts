import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (name: string) => readFileSync(resolve(root, name), 'utf8')

const recipe = (name: string) => {
  const found = new RegExp(`^${name}(?: [^\\n]*)?:[^\\n]*\\n((?:[ \\t]+[^\\n]*\\n?)*)`, 'm').exec(read('justfile'))
  return (found?.[1] ?? '').split('\n').map((line) => line.trim()).filter(Boolean)
}

const keys = read('.env.example').split('\n').filter(Boolean).map((line) => line.split('=')[0])

describe('the walk recipe', () => {
  it('runs the script under test/', () => {
    expect(recipe('walk')).toEqual(['bash test/walk.sh'])
  })

  it('is not part of the gate, which needs no server', () => {
    expect(recipe('gate')).toEqual(['just check', 'just test', 'just build'])
  })

  it('drives an executable script bash can parse', () => {
    expect(statSync(resolve(root, 'test/walk.sh')).mode & 0o111).toBeGreaterThan(0)
    expect(() => execFileSync('bash', ['-n', resolve(root, 'test/walk.sh')])).not.toThrow()
  })
})

describe('the walk keys', () => {
  it('are named in .env.example', () => {
    expect(keys).toContain('WALK_EMAIL')
    expect(keys).toContain('WALK_PASSWORD')
  })

  it('carry no VITE_ prefix, so no secret is inlined into the bundle', () => {
    expect(keys.filter((key) => /^VITE_/.test(key))).toEqual([
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID'
    ])
  })

  it('are not demanded by just env, so an empty one stops the walk alone', () => {
    expect(recipe('env').join('\n')).toContain("grep -oE '^VITE_[A-Z_]+' .env.example")
  })
})
