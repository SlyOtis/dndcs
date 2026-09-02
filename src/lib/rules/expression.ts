export type Scope = Record<string, number>

type Token = {
  kind: 'number' | 'name' | 'op'
  text: string
  at: number
}

const OPERATORS = [
  '&&',
  '||',
  '==',
  '!=',
  '<=',
  '>=',
  '<',
  '>',
  '+',
  '-',
  '*',
  '/',
  '%',
  '(',
  ')',
  ',',
  '?',
  ':',
  '!'
]

const FUNCTIONS: Record<string, (args: number[]) => number> = {
  floor: (a) => Math.floor(a[0]),
  ceil: (a) => Math.ceil(a[0]),
  round: (a) => Math.round(a[0]),
  abs: (a) => Math.abs(a[0]),
  sign: (a) => Math.sign(a[0]),
  min: (a) => Math.min(...a),
  max: (a) => Math.max(...a),
  clamp: (a) => Math.min(Math.max(a[0], a[1]), a[2]),
  pow: (a) => Math.pow(a[0], a[1])
}

export class ExpressionError extends Error {
  readonly expression: string
  readonly at: number

  constructor(message: string, expression: string, at: number) {
    super(`${message} in "${expression}" at ${at}`)
    this.name = 'ExpressionError'
    this.expression = expression
    this.at = at
  }
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < source.length) {
    const char = source[i]

    if (char === ' ' || char === '\t' || char === '\n') {
      i += 1
      continue
    }

    if (char >= '0' && char <= '9') {
      let end = i
      while (end < source.length && ((source[end] >= '0' && source[end] <= '9') || source[end] === '.')) end += 1
      tokens.push({ kind: 'number', text: source.slice(i, end), at: i })
      i = end
      continue
    }

    if (/[A-Za-z_]/.test(char)) {
      let end = i
      while (end < source.length && /[A-Za-z0-9_.]/.test(source[end])) end += 1
      tokens.push({ kind: 'name', text: source.slice(i, end), at: i })
      i = end
      continue
    }

    const operator = OPERATORS.find((candidate) => source.startsWith(candidate, i))
    if (!operator) throw new ExpressionError(`Unexpected character "${char}"`, source, i)
    tokens.push({ kind: 'op', text: operator, at: i })
    i += operator.length
  }

  return tokens
}

class Parser {
  private readonly tokens: Token[]
  private readonly source: string
  private readonly scope: Scope
  private index = 0

  constructor(source: string, scope: Scope) {
    this.source = source
    this.scope = scope
    this.tokens = tokenize(source)
  }

  run(): number {
    const value = this.ternary()
    if (this.index < this.tokens.length) {
      throw new ExpressionError('Trailing input', this.source, this.tokens[this.index].at)
    }
    return value
  }

  private peek(): Token | undefined {
    return this.tokens[this.index]
  }

  private eat(text: string): boolean {
    const token = this.peek()
    if (token && token.kind === 'op' && token.text === text) {
      this.index += 1
      return true
    }
    return false
  }

  private expect(text: string): void {
    if (!this.eat(text)) {
      const token = this.peek()
      throw new ExpressionError(`Expected "${text}"`, this.source, token ? token.at : this.source.length)
    }
  }

  private ternary(): number {
    const condition = this.or()
    if (!this.eat('?')) return condition
    const whenTrue = this.ternary()
    this.expect(':')
    const whenFalse = this.ternary()
    return condition !== 0 ? whenTrue : whenFalse
  }

  private or(): number {
    let left = this.and()
    while (this.eat('||')) {
      const right = this.and()
      left = left !== 0 || right !== 0 ? 1 : 0
    }
    return left
  }

  private and(): number {
    let left = this.comparison()
    while (this.eat('&&')) {
      const right = this.comparison()
      left = left !== 0 && right !== 0 ? 1 : 0
    }
    return left
  }

  private comparison(): number {
    let left = this.addition()
    for (;;) {
      if (this.eat('==')) left = left === this.addition() ? 1 : 0
      else if (this.eat('!=')) left = left !== this.addition() ? 1 : 0
      else if (this.eat('<=')) left = left <= this.addition() ? 1 : 0
      else if (this.eat('>=')) left = left >= this.addition() ? 1 : 0
      else if (this.eat('<')) left = left < this.addition() ? 1 : 0
      else if (this.eat('>')) left = left > this.addition() ? 1 : 0
      else return left
    }
  }

  private addition(): number {
    let left = this.multiplication()
    for (;;) {
      if (this.eat('+')) left += this.multiplication()
      else if (this.eat('-')) left -= this.multiplication()
      else return left
    }
  }

  private multiplication(): number {
    let left = this.unary()
    for (;;) {
      if (this.eat('*')) left *= this.unary()
      else if (this.eat('/')) {
        const divisor = this.unary()
        if (divisor === 0) throw new ExpressionError('Division by zero', this.source, this.index)
        left /= divisor
      } else if (this.eat('%')) {
        const divisor = this.unary()
        if (divisor === 0) throw new ExpressionError('Modulo by zero', this.source, this.index)
        left %= divisor
      } else return left
    }
  }

  private unary(): number {
    if (this.eat('-')) return -this.unary()
    if (this.eat('+')) return this.unary()
    if (this.eat('!')) return this.unary() === 0 ? 1 : 0
    return this.primary()
  }

  private primary(): number {
    const token = this.peek()
    if (!token) throw new ExpressionError('Unexpected end of expression', this.source, this.source.length)

    if (this.eat('(')) {
      const value = this.ternary()
      this.expect(')')
      return value
    }

    if (token.kind === 'number') {
      this.index += 1
      const value = Number(token.text)
      if (Number.isNaN(value)) throw new ExpressionError(`Bad number "${token.text}"`, this.source, token.at)
      return value
    }

    if (token.kind === 'name') {
      this.index += 1
      const fn = FUNCTIONS[token.text]
      if (fn) {
        this.expect('(')
        const args: number[] = []
        if (!this.eat(')')) {
          do {
            args.push(this.ternary())
          } while (this.eat(','))
          this.expect(')')
        }
        return fn(args)
      }
      const value = this.scope[token.text]
      if (value === undefined) throw new ExpressionError(`Unknown name "${token.text}"`, this.source, token.at)
      return value
    }

    throw new ExpressionError(`Unexpected token "${token.text}"`, this.source, token.at)
  }
}

export function getExpressionValue(source: string, scope: Scope): number {
  return new Parser(source, scope).run()
}

export function getExpressionNames(source: string): string[] {
  const names = new Set<string>()
  for (const token of tokenize(source)) {
    if (token.kind === 'name' && !FUNCTIONS[token.text]) names.add(token.text)
  }
  return [...names]
}
