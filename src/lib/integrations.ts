export type IntegrationStatus = 'live' | 'planned' | 'blocked'

export type Integration = {
  id: string
  title: string
  purpose: string
  status: IntegrationStatus
  note: string
  keyField?: string
  keyPrefix?: string
  siteUrl: string
  keyUrl?: string
}

export const INTEGRATIONS: Integration[] = [
  {
    id: 'firebase',
    title: 'Firebase',
    purpose: 'Sign in, and the database behind every character, campaign and map.',
    status: 'live',
    note: 'Configured at build time from .env. Nothing to enter here.',
    siteUrl: 'https://console.firebase.google.com/'
  },
  {
    id: 'replicate',
    title: 'Replicate',
    purpose: 'Runs the language and speech models behind the chat, the character import and the transcription.',
    status: 'live',
    note: 'Required for reading source material, importing a character and the chat. Your key is written to your own private user record and your browser calls Replicate with it.',
    keyField: 'replicate_api_key',
    keyPrefix: 'r8_',
    siteUrl: 'https://replicate.com/',
    keyUrl: 'https://replicate.com/account/api-tokens'
  },
  {
    id: 'github',
    title: 'GitHub',
    purpose: 'Reads the changelog shown in the app.',
    status: 'live',
    note: 'Public repository reads need no key.',
    siteUrl: 'https://github.com/'
  }
]

export function getIntegration(id: string): Integration | undefined {
  return INTEGRATIONS.find((entry) => entry.id === id)
}
