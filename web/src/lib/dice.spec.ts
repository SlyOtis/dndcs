import { describe, expect, it } from 'vitest'
import { getDirections, getShapes, getThrows, getTop } from './dice'

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

describe('every die is a closed solid the tray can throw', () => {
  const counts: [number, number, number][] = [
    [4, 4, 4],
    [6, 6, 6],
    [8, 8, 8],
    [10, 10, 10],
    [12, 12, 12],
    [20, 20, 20]
  ]

  for (const [die, faces, reads] of counts) {
    const [{ shape }] = getShapes(die, 1)

    it(`d${die} carries ${faces} faces and ${reads} readings`, () => {
      expect(shape.faces).toHaveLength(faces)
      expect(getDirections(shape)).toHaveLength(reads)
      expect(shape.labels).toHaveLength(reads)
    })

    it(`d${die} lays every face flat and faces it outward`, () => {
      for (const face of shape.faces) {
        const points = face.map((index) => shape.vertices[index])
        const [a, b, c] = points
        const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
        const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
        const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
        for (const point of points) {
          const off = [point[0] - a[0], point[1] - a[1], point[2] - a[2]]
          expect(Math.abs(off[0] * n[0] + off[1] * n[1] + off[2] * n[2])).toBeLessThan(1e-6)
        }
        expect(a[0] * n[0] + a[1] * n[1] + a[2] * n[2]).toBeGreaterThan(0)
      }
    })
  }
})

describe('the percentile throw', () => {
  it('splits a d100 into a tens die and a units die', () => {
    const [tens, units] = getShapes(100, 47)
    expect(tens.shape.labels[tens.value]).toBe('40')
    expect(units.shape.labels[units.value]).toBe('7')
  })

  it('reads a hundred as double zero', () => {
    const [tens, units] = getShapes(100, 100)
    expect(tens.shape.labels[tens.value]).toBe('00')
    expect(units.shape.labels[units.value]).toBe('0')
  })

  it('reads a ten on a d10 as zero', () => {
    const [ten] = getShapes(10, 10)
    expect(ten.shape.labels[ten.value]).toBe('0')
  })
})

describe('a throw settles on the number already rolled', () => {
  const wanted: [number, number, string][] = [
    [4, 3, '3'],
    [6, 5, '5'],
    [8, 2, '2'],
    [10, 9, '9.'],
    [12, 11, '11'],
    [20, 20, '20']
  ]

  for (const [die, value, label] of wanted) {
    it(`d${die} shows ${value} face up`, () => {
      const [one] = getThrows(getShapes(die, value), 16 / 9, seeded(die * 31))
      const last = one.frames[one.frames.length - 1]
      expect(one.labels[getTop(one.shape, last.quaternion)]).toBe(label)
      expect(last.position[1]).toBeLessThan(one.shape.radius + 0.1)
    })
  }

  it('keeps every die inside the tray', () => {
    const throws = getThrows([...getShapes(20, 1), ...getShapes(6, 6), ...getShapes(6, 1)], 1, seeded(7))
    for (const one of throws) {
      const [x, , z] = one.frames[one.frames.length - 1].position
      expect(Math.abs(x)).toBeLessThan(7.5)
      expect(Math.abs(z)).toBeLessThan(7.5)
    }
  })
})
