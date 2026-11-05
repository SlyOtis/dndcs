import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repo = resolve(root, '..')
const read = (name: string) => readFileSync(resolve(repo, name), 'utf8')

const recipe = (name: string) => {
  const found = new RegExp(`^${name}(?: [^\\n]*)?:[^\\n]*\\n((?:[ \\t]+[^\\n]*\\n?)*)`, 'm').exec(read('justfile'))
  return (found?.[1] ?? '').split('\n').map((line) => line.trim()).filter(Boolean)
}

describe('the service owns the data, not a hosted database', () => {
  it('ships the web without the firebase package', () => {
    const manifest = JSON.parse(read('web/package.json'))
    expect(Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })).not.toContain('firebase')
  })

  it('carries no firebase command in any recipe', () => {
    expect(read('justfile')).not.toMatch(/\bfirebase\b/)
  })

  it('names no Firebase key in .env.example', () => {
    expect(read('.env.example')).not.toMatch(/^VITE_FIREBASE_/m)
  })

  it('deploys only on a merge to main, versioned by the commit, with no deploy recipe', () => {
    expect(recipe('deploy')).toEqual([])
    const workflow = read('.github/workflows/azure-deploy.yml')
    expect(workflow).toMatch(/^on:\n  push:\n    branches: \[main\]\n\njobs:/m)
    expect(workflow).toContain('echo "tag=${GITHUB_SHA::12}" >> $GITHUB_OUTPUT')
  })

  it('reaches the api through the dev proxy and nothing else', () => {
    const vite = read('web/vite.config.ts')
    expect(vite).toMatch(/["']\/api["']/)
    expect(vite).not.toContain('/replicate')
    expect(vite).not.toContain('/media')
  })
})
