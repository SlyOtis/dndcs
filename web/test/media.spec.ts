import { describe, expect, it } from 'vitest'
import type { PluginOption, UserConfig } from 'vite'
import config from '../vite.config'

const settled = config as UserConfig

function getPluginNames(options: PluginOption[] | undefined): string[] {
  return (options ?? []).flat(Infinity as 1).map((option) => (option && typeof option === 'object' && 'name' in option ? option.name : ''))
}

describe('the dev server', () => {
  it('proxies the api to the service and nothing else', () => {
    expect(Object.keys(settled.server?.proxy ?? {})).toEqual(['/api'])
  })

  it('carries no media store of its own, since originals live behind the service', () => {
    expect(getPluginNames(settled.plugins)).not.toContain('media-store')
  })
})
