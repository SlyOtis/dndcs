import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Class, ClassFeature } from '../src/lib/class.types'

const root = resolve(__dirname, '../public/sources/classes')
const read = (name: string) => JSON.parse(readFileSync(resolve(root, `${name}.json`), 'utf8'))
const { classes } = read('index') as { classes: string[] }

describe('every class the index names carries its level features', () => {
  for (const id of classes) {
    const entry = read(id) as Class
    const features = entry.features as ClassFeature[]

    it(`${id} is a class document with features`, () => {
      expect(entry.id).toBe(id)
      expect(Array.isArray(features)).toBe(true)
      expect(features.length).toBeGreaterThan(0)
    })

    it(`${id} features carry id, name, description, level and source`, () => {
      for (const feature of features) {
        expect(feature).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          level: expect.any(Number),
          source: expect.stringMatching(/^(base|subclass|optional|class)$/)
        })
        expect(feature.id.trim()).not.toBe('')
        expect(feature.name.trim()).not.toBe('')
        expect(feature.description.trim()).not.toBe('')
        expect(feature.level).toBeGreaterThanOrEqual(1)
        expect(feature.level).toBeLessThanOrEqual(20)
      }
    })

    it(`${id} repeats no feature id`, () => {
      const ids = features.map((feature) => feature.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it(`${id} arrives with a level 1 feature`, () => {
      expect(features.some((feature) => feature.level === 1)).toBe(true)
    })
  }
})
