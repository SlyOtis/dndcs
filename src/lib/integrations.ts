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
    id: 'storage',
    title: 'Cloud Storage',
    purpose: 'Would hold map images, portraits and sounds so the whole table sees them.',
    status: 'blocked',
    note: 'Since February 2026 a Storage bucket needs a billing account, and this project has none. Uploads are kept in your own browser instead, so a picture you add is visible to you and to nobody else. Attach billing and uploads move to Storage on their own.',
    siteUrl: 'https://console.firebase.google.com/project/dndcs-420/storage'
  },
  {
    id: 'replicate',
    title: 'Replicate',
    purpose: 'Runs the language and speech models behind the chat, the character import and the transcription.',
    status: 'live',
    note: 'Your key stays on your own user document and your browser calls Replicate with it.',
    keyField: 'replicate_api_key',
    keyPrefix: 'r8_',
    siteUrl: 'https://replicate.com/',
    keyUrl: 'https://replicate.com/account/api-tokens'
  },
  {
    id: 'suno',
    title: 'Suno',
    purpose: 'Would generate campaign music and ambience for the soundboard.',
    status: 'blocked',
    note: 'Suno publishes no public API. Access runs through third party relays that proxy your account through their servers, so a key pasted into one is a key handed to them. This stays off until Suno ships an official API.',
    keyField: 'suno_api_key',
    siteUrl: 'https://suno.com/'
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
