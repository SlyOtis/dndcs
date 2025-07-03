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
      display_name: userData.display_name || '',
      photo_url: userData.photo_url,
      replicate_api_key: userData.replicate_api_key || '',
      created_at: serverTimestamp() as any,
      updated_at: serverTimestamp() as any,
      preferences: {
        theme: 'medieval',
        sound_enabled: true,
        animations_enabled: true,
        auto_save: true,
        recent_characters: []
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
      updated_at: serverTimestamp()
    });
  },

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    const userId = getCurrentUserId();
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    
    await updateDoc(userRef, {
      preferences,
      updated_at: serverTimestamp()
    });
  },

  subscribeToProfile(callback: (profile: UserProfile | null) => void): Unsubscribe {
    const userId = getCurrentUserId();
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    
    return onSnapshot(userRef, (doc) => {
      callback(doc.exists() ? doc.data() as UserProfile : null);
    });
  },

  async setUserDetails(userId: string, details: any): Promise<void> {
    const detailsRef = doc(db, COLLECTIONS.USERS, userId, 'data', 'details');
    
    console.log('Firestore Service: Setting user details for userId:', userId);
    console.log('Firestore Service: Details path:', `users/${userId}/data/details`);
    console.log('Firestore Service: Details to store:', details);
    
    const dataToStore = {
      ...details,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };
    
    await setDoc(detailsRef, dataToStore);
    console.log('Firestore Service: User details stored successfully');
  },

  async getUserDetails(userId?: string): Promise<any> {
    const uid = userId || getCurrentUserId();
    const detailsRef = doc(db, COLLECTIONS.USERS, uid, 'data', 'details');
    
    console.log('Firestore Service: Getting user details for userId:', uid);
    console.log('Firestore Service: Details path:', `users/${uid}/data/details`);
    
    const detailsSnap = await getDoc(detailsRef);
    const exists = detailsSnap.exists();
    const data = exists ? detailsSnap.data() : null;
    
    console.log('Firestore Service: Details document exists:', exists);
    console.log('Firestore Service: Retrieved data:', data);
    
    return data;
  }
};

// Character Operations
export const characterService = {
  async createCharacter(character: Character, metadata?: Partial<CharacterDocument['metadata']>): Promise<string> {
    const userId = getCurrentUserId();
    const characterRef = doc(collection(db, COLLECTIONS.CHARACTERS));
    
    const characterDoc: CharacterDocument = {
      id: characterRef.id,
      owner_id: userId,
      character,
      metadata: {
        name: character.name || 'Unnamed Character',
        level: character.level || 1,
        class: character.class?.name || 'Unknown',
        race: character.race?.name || 'Unknown',
        created_at: serverTimestamp() as any,
        updated_at: serverTimestamp() as any,
        version: '1.0.0',
        tags: [],
        is_template: false,
        is_public: false,
        ...metadata
      },
      permissions: {
        viewers: [],
        editors: [],
        dm_override: true
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
      'metadata.updated_at': serverTimestamp(),
      'metadata.last_played_at': serverTimestamp()
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
      where('owner_id', '==', uid),
      orderBy('metadata.updated_at', 'desc')
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
      where('owner_id', '==', uid),
      orderBy('metadata.updated_at', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const characters = querySnapshot.docs.map(doc => doc.data() as CharacterDocument);
      callback(characters);
    });
  },

  async setCharacterSources(characterId: string, sources: string[]): Promise<void> {
    const sourcesRef = doc(db, COLLECTIONS.CHARACTERS, characterId, 'data', 'sources');
    
    await setDoc(sourcesRef, {
      sources,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  },

  async getCharacterSources(characterId: string): Promise<string[]> {
    const sourcesRef = doc(db, COLLECTIONS.CHARACTERS, characterId, 'data', 'sources');
    const sourcesSnap = await getDoc(sourcesRef);
    
    return sourcesSnap.exists() ? sourcesSnap.data().sources || [] : [];
  },

  async setCharacterDetails(characterId: string, details: any): Promise<void> {
    const detailsRef = doc(db, COLLECTIONS.CHARACTERS, characterId, 'data', 'details');
    
    await setDoc(detailsRef, {
      details,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  },

  async getCharacterDetails(characterId: string): Promise<any> {
    const detailsRef = doc(db, COLLECTIONS.CHARACTERS, characterId, 'data', 'details');
    const detailsSnap = await getDoc(detailsRef);
    
    return detailsSnap.exists() ? detailsSnap.data().details : null;
  }
};

// Campaign Operations
export const campaignService = {
  async createCampaign(campaignData: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const campaignRef = doc(collection(db, COLLECTIONS.CAMPAIGNS));
    
    const campaign: Campaign = {
      ...campaignData,
      id: campaignRef.id,
      created_at: serverTimestamp() as any,
      updated_at: serverTimestamp() as any
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
    const dmQuery = query(campaignsRef, where('dm_id', '==', userId));
    const playerQuery = query(campaignsRef, where('player_ids', 'array-contains', userId));
    
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
      b.updated_at.toMillis() - a.updated_at.toMillis()
    );
  },

  subscribeToUserCampaigns(callback: (campaigns: Campaign[]) => void): Unsubscribe {
    const userId = getCurrentUserId();
    const campaignsRef = collection(db, COLLECTIONS.CAMPAIGNS);
    
    // For simplicity, we'll use a single query for DM campaigns
    // In production, you might want to use a compound query or multiple subscriptions
    const q = query(
      campaignsRef,
      where('dm_id', '==', userId),
      orderBy('updated_at', 'desc')
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
      user_id: userId,
      character_id: characterId,
      campaign_id: campaignId,
      messages: [],
      created_at: serverTimestamp() as any,
      updated_at: serverTimestamp() as any
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
      where('user_id', '==', userId),
      orderBy('updated_at', 'desc'),
      limit(limit_count)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as ChatSession);
  }
};