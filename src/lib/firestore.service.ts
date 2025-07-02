import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type {
  UserProfile,
  Campaign,
  CharacterDocument,
  ChatSession,
  UserPreferences
} from './firestore.types';
import { COLLECTIONS } from './firestore.types';
import type { Character } from './character.types';

// Auth helper
function getCurrentUserId(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user.uid;
}

// User Profile Operations
export const userService = {
  async createProfile(userData: Partial<UserProfile>): Promise<void> {
    const userId = getCurrentUserId();
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    
    const profile: UserProfile = {
      uid: userId,
      email: userData.email || '',
      displayName: userData.displayName || '',
      photoURL: userData.photoURL,
      replicateApiKey: userData.replicateApiKey || '',
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      preferences: {
        theme: 'medieval',
        soundEnabled: true,
        animationsEnabled: true,
        autoSave: true,
        recentCharacters: []
      }
    };
    
    await setDoc(userRef, profile);
  },

  async getProfile(userId?: string): Promise<UserProfile | null> {
    const uid = userId || getCurrentUserId();
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    const userSnap = await getDoc(userRef);
    
    return userSnap.exists() ? userSnap.data() as UserProfile : null;
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    const userId = getCurrentUserId();
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    const userId = getCurrentUserId();
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    
    await updateDoc(userRef, {
      preferences,
      updatedAt: serverTimestamp()
    });
  },

  subscribeToProfile(callback: (profile: UserProfile | null) => void): Unsubscribe {
    const userId = getCurrentUserId();
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    
    return onSnapshot(userRef, (doc) => {
      callback(doc.exists() ? doc.data() as UserProfile : null);
    });
  }
};

// Character Operations
export const characterService = {
  async createCharacter(character: Character, metadata?: Partial<CharacterDocument['metadata']>): Promise<string> {
    const userId = getCurrentUserId();
    const characterRef = doc(collection(db, COLLECTIONS.CHARACTERS));
    
    const characterDoc: CharacterDocument = {
      id: characterRef.id,
      ownerId: userId,
      character,
      metadata: {
        name: character.name || 'Unnamed Character',
        level: character.level || 1,
        class: character.class?.name || 'Unknown',
        race: character.race?.name || 'Unknown',
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        version: '1.0.0',
        tags: [],
        isTemplate: false,
        isPublic: false,
        ...metadata
      },
      permissions: {
        viewers: [],
        editors: [],
        dmOverride: true
      }
    };
    
    await setDoc(characterRef, characterDoc);
    return characterRef.id;
  },

  async getCharacter(characterId: string): Promise<CharacterDocument | null> {
    const characterRef = doc(db, COLLECTIONS.CHARACTERS, characterId);
    const characterSnap = await getDoc(characterRef);
    
    return characterSnap.exists() ? characterSnap.data() as CharacterDocument : null;
  },

  async updateCharacter(characterId: string, character: Character): Promise<void> {
    const characterRef = doc(db, COLLECTIONS.CHARACTERS, characterId);
    
    await updateDoc(characterRef, {
      character,
      'metadata.updatedAt': serverTimestamp(),
      'metadata.lastPlayedAt': serverTimestamp()
    });
  },

  async deleteCharacter(characterId: string): Promise<void> {
    const characterRef = doc(db, COLLECTIONS.CHARACTERS, characterId);
    await deleteDoc(characterRef);
  },

  async getUserCharacters(userId?: string): Promise<CharacterDocument[]> {
    const uid = userId || getCurrentUserId();
    const charactersRef = collection(db, COLLECTIONS.CHARACTERS);
    const q = query(
      charactersRef,
      where('ownerId', '==', uid),
      orderBy('metadata.updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as CharacterDocument);
  },

  subscribeToCharacter(characterId: string, callback: (character: CharacterDocument | null) => void): Unsubscribe {
    const characterRef = doc(db, COLLECTIONS.CHARACTERS, characterId);
    
    return onSnapshot(characterRef, (doc) => {
      callback(doc.exists() ? doc.data() as CharacterDocument : null);
    });
  },

  subscribeToUserCharacters(callback: (characters: CharacterDocument[]) => void, userId?: string): Unsubscribe {
    const uid = userId || getCurrentUserId();
    const charactersRef = collection(db, COLLECTIONS.CHARACTERS);
    const q = query(
      charactersRef,
      where('ownerId', '==', uid),
      orderBy('metadata.updatedAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const characters = querySnapshot.docs.map(doc => doc.data() as CharacterDocument);
      callback(characters);
    });
  }
};

// Campaign Operations
export const campaignService = {
  async createCampaign(campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const campaignRef = doc(collection(db, COLLECTIONS.CAMPAIGNS));
    
    const campaign: Campaign = {
      ...campaignData,
      id: campaignRef.id,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };
    
    await setDoc(campaignRef, campaign);
    return campaignRef.id;
  },

  async getCampaign(campaignId: string): Promise<Campaign | null> {
    const campaignRef = doc(db, COLLECTIONS.CAMPAIGNS, campaignId);
    const campaignSnap = await getDoc(campaignRef);
    
    return campaignSnap.exists() ? campaignSnap.data() as Campaign : null;
  },

  async getUserCampaigns(): Promise<Campaign[]> {
    const userId = getCurrentUserId();
    const campaignsRef = collection(db, COLLECTIONS.CAMPAIGNS);
    
    // Get campaigns where user is DM or player
    const dmQuery = query(campaignsRef, where('dmId', '==', userId));
    const playerQuery = query(campaignsRef, where('playerIds', 'array-contains', userId));
    
    const [dmSnap, playerSnap] = await Promise.all([
      getDocs(dmQuery),
      getDocs(playerQuery)
    ]);
    
    const campaigns = new Map<string, Campaign>();
    
    dmSnap.docs.forEach(doc => {
      campaigns.set(doc.id, doc.data() as Campaign);
    });
    
    playerSnap.docs.forEach(doc => {
      campaigns.set(doc.id, doc.data() as Campaign);
    });
    
    return Array.from(campaigns.values()).sort((a, b) => 
      b.updatedAt.toMillis() - a.updatedAt.toMillis()
    );
  },

  subscribeToUserCampaigns(callback: (campaigns: Campaign[]) => void): Unsubscribe {
    const userId = getCurrentUserId();
    const campaignsRef = collection(db, COLLECTIONS.CAMPAIGNS);
    
    // For simplicity, we'll use a single query for DM campaigns
    // In production, you might want to use a compound query or multiple subscriptions
    const q = query(
      campaignsRef,
      where('dmId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const campaigns = querySnapshot.docs.map(doc => doc.data() as Campaign);
      callback(campaigns);
    });
  }
};

// Chat Operations
export const chatService = {
  async createChatSession(characterId?: string, campaignId?: string): Promise<string> {
    const userId = getCurrentUserId();
    const chatRef = doc(collection(db, COLLECTIONS.CHAT_SESSIONS));
    
    const session: ChatSession = {
      id: chatRef.id,
      userId,
      characterId,
      campaignId,
      messages: [],
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };
    
    await setDoc(chatRef, session);
    return chatRef.id;
  },

  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    const chatRef = doc(db, COLLECTIONS.CHAT_SESSIONS, sessionId);
    const chatSnap = await getDoc(chatRef);
    
    return chatSnap.exists() ? chatSnap.data() as ChatSession : null;
  },

  async getUserChatSessions(limit_count = 10): Promise<ChatSession[]> {
    const userId = getCurrentUserId();
    const chatRef = collection(db, COLLECTIONS.CHAT_SESSIONS);
    const q = query(
      chatRef,
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(limit_count)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as ChatSession);
  }
};