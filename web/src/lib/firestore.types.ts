import type { Timestamp } from 'firebase/firestore';
import type { Character } from './character.types';

// User profile stored in Firestore
export interface UserProfile {
  uid: string;
  email: string;
  display_name: string;
  photo_url?: string;
  friends: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
  preferences: UserPreferences;
}

// User preferences
export interface UserPreferences {
  theme: string;
  sound_enabled: boolean;
  sound_volume: number;
  animations_enabled: boolean;
  recent_characters: string[];
  shortcuts?: Shortcut[];
}

// An action the player pinned to the navigator, with the key that fires it or none.
export interface Shortcut {
  action: string;
  key: string;
}

// A song on a campaign's playlist. The bytes live in the swarm at address.
export interface Song extends Access {
  id: string;
  title: string;
  address: string;
  duration: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// What every shared document carries. The owner is the uid that made it.
export interface Access {
  owner_id: string;
  share_campaigns: string[];
  share_parties: string[];
  share_users: string[];
  // Every uid the share resolves to. Rules filter nothing, so a list query is
  // constrained by this and the rule reads the same field.
  readers: string[];
}

// A group that plays together. It stands on its own and a campaign gathers them.
export interface Party {
  id: string;
  name: string;
  description: string;
  image_url: string;
  owner_id: string;
  member_ids: string[];
  character_ids: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Campaign stored in Firestore
export interface Campaign {
  id: string;
  name: string;
  description: string;
  dm_id: string;
  player_ids: string[];
  party_ids: string[];
  character_ids: string[];
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  settings: CampaignSettings;
}

export interface CampaignSettings {
  allow_character_editing: boolean;
  share_character_sheets: boolean;
  private_notes: boolean;
  experience_mode: 'individual' | 'milestone' | 'shared';
}

// Character document stored in Firestore
export interface CharacterDocument {
  id: string;
  owner_id: string;
  campaign_id?: string;
  character: Character;
  metadata: CharacterMetadata;
  permissions: CharacterPermissions;
}

export type CharacterStatus = 'draft' | 'ready';

export interface CharacterMetadata {
  name: string;
  level: number;
  class: string;
  race: string;
  status?: CharacterStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
  last_played_at?: Timestamp;
  version: string;
  tags: string[];
  is_template: boolean;
  is_public: boolean;
}

export interface CharacterPermissions {
  viewers: string[];
  editors: string[];
  dm_override: boolean;
}

export type MapMarkerKind =
  | 'region'
  | 'city'
  | 'town'
  | 'keep'
  | 'dungeon'
  | 'inn'
  | 'temple'
  | 'npc'
  | 'quest'
  | 'danger'
  | 'treasure'
  | 'note'
  | 'village'
  | 'ruin'
  | 'cave'
  | 'tower'
  | 'shrine'
  | 'camp'
  | 'harbour'
  | 'bridge'
  | 'forest'
  | 'mountain'
  | 'swamp'
  | 'lake'
  | 'road'
  | 'portal'
  | 'battle'
  | 'grave'
  | 'market'
  | 'forge';

export interface MapMarker {
  id: string;
  title: string;
  description?: string;
  kind: MapMarkerKind;
  x: number;
  y: number;
  is_visible: boolean;
  min_zoom: number;
  max_zoom: number;
  link_map_id?: string;
  record_kind?: CampaignRecordKind;
  record_id?: string;
}

export interface MapLayer {
  id: string;
  title: string;
  image_url: string;
  min_zoom: number;
  max_zoom: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface CampaignMap {
  id: string;
  title: string;
  image_url: string;
  layers: MapLayer[];
  markers: MapMarker[];
  is_visible: boolean;
  parent_map_id?: string;
  min_zoom: number;
  max_zoom: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type CampaignRecordKind = 'place' | 'character' | 'item' | 'quest' | 'session';

export type CampaignChatKind = 'message' | 'roll';

export type CampaignCardKind = '' | 'item_card' | 'npc_card';

export interface CampaignChatEntry {
  id: string;
  author_id: string;
  author_name: string;
  kind: CampaignChatKind;
  body: string;
  query: string;
  is_hidden: boolean;
  card_kind?: CampaignCardKind;
  roll_kind: string;
  formula: string;
  dice: number[];
  roll: number;
  total: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type CombatantKind = 'character' | 'npc';

export interface EncounterCombatant {
  id: string;
  name: string;
  kind: CombatantKind;
  character_id?: string;
  npc_id?: string;
  modifier: number;
  initiative: number;
  hit_points: number;
  max_hit_points: number;
  conditions: string[];
  is_hit_points_known: boolean;
}

export interface CampaignEncounter extends Access {
  id: string;
  title: string;
  combatants: EncounterCombatant[];
  round: number;
  turn: number;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  CHARACTERS: 'characters',
  CAMPAIGNS: 'campaigns',
  PARTIES: 'parties',
  CHAT: 'chat',
  MAPS: 'maps',
  ENCOUNTERS: 'encounters',
  SONGS: 'songs'
} as const;

// Helper types for Firestore operations
export type FirestoreTimestamp = Timestamp;
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

// Who a resource belongs to. A campaign holds what the table shares, a user holds their own.
export interface Owner {
  at: typeof COLLECTIONS.CAMPAIGNS | typeof COLLECTIONS.USERS;
  id: string;
}
