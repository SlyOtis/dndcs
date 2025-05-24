import type { Timestamp } from 'firebase/firestore';
import type { Character } from './character.types';

// User profile stored in Firestore
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  preferences: UserPreferences;
}

// User preferences
export interface UserPreferences {
  theme: string;
  defaultCharacterId?: string;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  autoSave: boolean;
  recentCharacters: string[]; // Array of character IDs
}

// Campaign stored in Firestore
export interface Campaign {
  id: string;
  name: string;
  description: string;
  dmId: string; // User ID of the Dungeon Master
  playerIds: string[]; // Array of user IDs
  characterIds: string[]; // Array of character IDs in this campaign
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  settings: CampaignSettings;
}

export interface CampaignSettings {
  allowCharacterEditing: boolean;
  shareCharacterSheets: boolean;
  privateNotes: boolean;
  experienceMode: 'individual' | 'milestone' | 'shared';
}

// Character document stored in Firestore
export interface CharacterDocument {
  id: string;
  ownerId: string; // User ID of the character owner
  campaignId?: string; // Optional campaign association
  character: Character; // The actual character data
  metadata: CharacterMetadata;
  permissions: CharacterPermissions;
}

export interface CharacterMetadata {
  name: string;
  level: number;
  class: string;
  race: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastPlayedAt?: Timestamp;
  version: string; // For data migration
  tags: string[];
  isTemplate: boolean;
  isPublic: boolean;
}

export interface CharacterPermissions {
  viewers: string[]; // User IDs who can view
  editors: string[]; // User IDs who can edit
  dmOverride: boolean; // Allow DM to override permissions in campaigns
}

// Chat/Session data
export interface ChatSession {
  id: string;
  userId: string;
  characterId?: string;
  campaignId?: string;
  messages: ChatMessage[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Timestamp;
  metadata?: {
    characterAction?: boolean;
    diceRoll?: boolean;
    spellCast?: boolean;
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