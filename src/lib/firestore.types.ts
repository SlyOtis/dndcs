import type { Timestamp } from 'firebase/firestore';
import type { Character } from './character.types';

// User profile stored in Firestore
export interface UserProfile {
  uid: string;
  email: string;
  display_name: string;
  photo_url?: string;
  replicate_api_key: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  preferences: UserPreferences;
}

// User preferences
export interface UserPreferences {
  theme: string;
  default_character_id?: string;
  sound_enabled: boolean;
  animations_enabled: boolean;
  auto_save: boolean;
  recent_characters: string[];
}

// Campaign stored in Firestore
export interface Campaign {
  id: string;
  name: string;
  description: string;
  dm_id: string;
  player_ids: string[];
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

export interface CharacterMetadata {
  name: string;
  level: number;
  class: string;
  race: string;
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

// Chat/Session data
export interface ChatSession {
  id: string;
  user_id: string;
  character_id?: string;
  campaign_id?: string;
  messages: ChatMessage[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Timestamp;
  metadata?: {
    character_action?: boolean;
    dice_roll?: boolean;
    spell_cast?: boolean;
  };
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
  | 'note';

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
}

export interface CampaignMap {
  id: string;
  title: string;
  image_url: string;
  layers: MapLayer[];
  markers: MapMarker[];
  is_visible: boolean;
  min_zoom: number;
  max_zoom: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CampaignChronicle {
  campaign_id: string;
  campaign_name: string;
  session: CampaignSession;
}

export interface CampaignErrand {
  campaign_id: string;
  campaign_name: string;
  quest: CampaignQuest;
}

export interface PartyMember {
  profile: UserProfile;
  campaign_id: string;
  campaign_name: string;
  is_dm: boolean;
}

export type CampaignRecordKind = 'location' | 'npc' | 'quest' | 'session';

export type QuestState = 'active' | 'done' | 'abandoned';

export type Disposition = 'friendly' | 'neutral' | 'hostile' | 'unknown';

export interface CampaignSession {
  id: string;
  number: number;
  title: string;
  played_at: string;
  summary: string;
  present_character_ids: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CampaignQuest {
  id: string;
  title: string;
  description: string;
  state: QuestState;
  level?: number;
  giver_npc_id?: string;
  location_id?: string;
  is_known: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CampaignNpc {
  id: string;
  name: string;
  role: string;
  description: string;
  disposition: Disposition;
  location_id?: string;
  image_url?: string;
  stat_block_id?: string;
  is_known: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CampaignLocation {
  id: string;
  name: string;
  description: string;
  kind: MapMarkerKind;
  map_id?: string;
  marker_id?: string;
  is_known: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  CHARACTERS: 'characters',
  CAMPAIGNS: 'campaigns',
  CHAT_SESSIONS: 'chatSessions',
  MAPS: 'maps',
  SESSIONS: 'sessions',
  QUESTS: 'quests',
  NPCS: 'npcs',
  LOCATIONS: 'locations'
} as const;

// Helper types for Firestore operations
export type FirestoreTimestamp = Timestamp;
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];