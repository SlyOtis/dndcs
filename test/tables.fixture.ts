import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'svelte/compiler'

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export const tabs = 'src/components/character_sheet/main_tabs'

type Node = Record<string, any>

export const component = (path: string) => {
  const source = readFileSync(resolve(root, path), 'utf8')
  const parsed = parse(source, { modern: true }) as unknown as Node

  const nodes = (from: unknown, match: (node: Node) => boolean): Node[] => {
    const found: Node[] = []
    const seen = new Set<unknown>()

    const visit = (value: unknown) => {
      if (!value || typeof value !== 'object') return
      if (seen.has(value)) return
      seen.add(value)

      if (Array.isArray(value)) {
        value.forEach((entry) => visit(entry))
        return
      }

      const node = value as Node
      if (typeof node.type === 'string' && match(node)) found.push(node)
      Object.values(node).forEach((entry) => visit(entry))
    }

    visit(from)
    return found
  }

  const span = (node: Node) => source.slice(node.start, node.end)

  const flat = (value: string) => value.replace(/\s+/g, ' ').trim()

  const rules = nodes(parsed.css, (node) => node.type === 'Rule')

  const prelude = (rule: Node) => flat(span(rule.prelude))

  const blocks = rules.map((rule) => ({
    selector: prelude(rule),
    declared: Object.fromEntries(
      (rule.block.children as Node[])
        .filter((child) => child.type === 'Declaration')
        .map((child) => [child.property as string, flat(child.value as string)])
    ) as Record<string, string>
  }))

  const style = (selector: string): Record<string, string> | null =>
    blocks.find((entry) => entry.selector === selector)?.declared ?? null

  const tracks = (selector: string) => {
    const declared = style(selector)?.['grid-template-columns']
    return declared ? declared.split(' ') : []
  }

  const attribute = (node: Node, name: string): string | null => {
    if (!Array.isArray(node.attributes)) return null

    const found = (node.attributes as Node[]).find((entry) => entry.type === 'Attribute' && entry.name === name)
    if (!found) return null

    const whole = span(found)
    const at = whole.indexOf('=')
    return at === -1 ? '' : whole.slice(at + 1).replace(/^["']|["']$/g, '')
  }

  const classes = (node: Node) => (attribute(node, 'class') ?? '').split(/\s+/).filter(Boolean)

  const elements = (name: string) =>
    nodes(parsed.fragment, (node) => node.type === 'RegularElement' && node.name === name)

  const listed = (name: string, klass: string) =>
    elements(name).filter((node) => classes(node).includes(klass))

  const children = (node: Node) =>
    node.fragment ? (node.fragment.nodes as Node[]).filter((child) => child.type === 'RegularElement') : []

  const content = (node: Node) =>
    node.fragment
      ? (node.fragment.nodes as Node[])
          .map((child) => (child.type === 'Text' ? (child.data as string) : span(child)))
          .join('')
          .trim()
      : ''

  const cell = (row: Node, klass: string) => {
    const found = children(row).find((child) => classes(child).includes(klass))
    if (!found) throw new Error(`${path} has no cell .${klass}`)
    return found
  }

  return {
    source,
    parsed,
    nodes,
    blocks,
    style,
    tracks,
    selectors: rules.map(prelude),
    elements,
    listed,
    children,
    classes,
    attribute,
    content,
    cell
  }
}

export const placed = (node: Record<string, string>) =>
  ['position', 'top', 'right', 'bottom', 'left', 'transform', 'z-index'].filter((property) => property in node)
