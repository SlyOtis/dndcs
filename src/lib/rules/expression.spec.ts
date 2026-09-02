import { describe, expect, it } from 'vitest'
import { ExpressionError, getExpressionNames, getExpressionValue } from './expression'

describe('getExpressionValue', () => {
  it('applies arithmetic precedence', () => {
    expect(getExpressionValue('2 + 3 * 4', {})).toBe(14)
    expect(getExpressionValue('(2 + 3) * 4', {})).toBe(20)
  })

  it('reads dotted names from the scope', () => {
    expect(getExpressionValue('mod.dex + prof', { 'mod.dex': 3, prof: 2 })).toBe(5)
  })

  it('computes the 5e ability modifier', () => {
    expect(getExpressionValue('floor((score - 10) / 2)', { score: 18 })).toBe(4)
    expect(getExpressionValue('floor((score - 10) / 2)', { score: 7 })).toBe(-2)
  })

  it('computes the 5e proficiency bonus at every tier', () => {
    const bonus = (level: number) => getExpressionValue('2 + floor((level - 1) / 4)', { level })
    expect([1, 4, 5, 8, 9, 12, 13, 16, 17, 20].map(bonus)).toEqual([2, 2, 3, 3, 4, 4, 5, 5, 6, 6])
  })

  it('handles the ternary and comparisons', () => {
    expect(getExpressionValue('level >= 5 ? 2 : 1', { level: 5 })).toBe(2)
    expect(getExpressionValue('level >= 5 ? 2 : 1', { level: 4 })).toBe(1)
  })

  it('handles unary minus and boolean operators', () => {
    expect(getExpressionValue('-score + 1', { score: 4 })).toBe(-3)
    expect(getExpressionValue('a > 0 && b > 0', { a: 1, b: 2 })).toBe(1)
    expect(getExpressionValue('a > 0 || b > 0', { a: -1, b: -2 })).toBe(0)
  })

  it('exposes the maths helpers', () => {
    expect(getExpressionValue('max(1, 2, 3)', {})).toBe(3)
    expect(getExpressionValue('clamp(15, 1, 10)', {})).toBe(10)
    expect(getExpressionValue('abs(0 - 4)', {})).toBe(4)
  })

  it('refuses an unknown name', () => {
    expect(() => getExpressionValue('mod.zzz', {})).toThrow(ExpressionError)
  })

  it('refuses arbitrary code', () => {
    expect(() => getExpressionValue('globalThis["fetch"]', {})).toThrow(ExpressionError)
    expect(() => getExpressionValue('1; drop()', {})).toThrow(ExpressionError)
  })

  it('refuses division by zero', () => {
    expect(() => getExpressionValue('1 / 0', {})).toThrow(ExpressionError)
  })
})

describe('getExpressionNames', () => {
  it('lists the scope names without the helpers', () => {
    expect(getExpressionNames('floor((attr.str - 10) / 2) + prof').sort()).toEqual(['attr.str', 'prof'])
  })
})
