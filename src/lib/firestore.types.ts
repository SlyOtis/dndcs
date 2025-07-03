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

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  CHARACTERS: 'characters',
  CAMPAIGNS: 'campaigns',
  CHAT_SESSIONS: 'chatSessions'
} as const;

// Helper types for Firestore operations
export type FirestoreTimestamp = Timestamp;
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];