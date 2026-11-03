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
  },
  {
    id: 'random-org',
    title: 'RANDOM.ORG',
    purpose: 'Draws the true random numbers behind every die the sheet rolls.',
    status: 'live',
    note: 'The anonymous plain integer endpoint needs no key. It has a daily bit quota per address.',
    siteUrl: 'https://www.random.org/'
  },
  {
    id: 'unsplash',
    title: 'Unsplash',
    purpose: 'Pictures for items and creatures the chat finds.',
    status: 'blocked',
    note: 'The chat calls source.unsplash.com, which Unsplash retired and which answers 503. No picture arrives until it moves to the Unsplash API.',
    siteUrl: 'https://unsplash.com/developers'
  },
  {
    id: 'youtube',
    title: 'YouTube',
    purpose: 'Plays a YouTube link set as a character background as an embedded video.',
    status: 'live',
    note: 'Embeds through youtube-nocookie.com and needs no key.',
    siteUrl: 'https://www.youtube.com/'
  }
]

export function getIntegration(id: string): Integration | undefined {
  return INTEGRATIONS.find((entry) => entry.id === id)
}
