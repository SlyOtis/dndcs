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
import type { FirebaseError } from 'firebase/app';
import { auth, db } from './firebase';
import { isDeadFile } from './storage.service';
import type {
  UserProfile,
  Campaign,
  CampaignChatEntry,
  CampaignEncounter,
  CampaignLocation,
  CampaignMap,
  CampaignNpc,
  CampaignQuest,
  CampaignSession,
  CampaignChronicle,
  CampaignErrand,
  CampaignChart,
  CampaignFigure,
  CampaignHaunt,
  CampaignFray,
  PartyMember,
  CharacterDocument,
  CharacterStatus,
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

type CampaignRecord = { id: string };

async function getRecords<T extends CampaignRecord>(campaignId: string, name: string): Promise<T[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.CAMPAIGNS, campaignId, name));
  return snapshot.docs.map((entry) => entry.data() as T);
}

async function postRecord<T extends CampaignRecord>(
  campaignId: string,
  name: string,
  fields: Omit<T, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  const target = doc(collection(db, COLLECTIONS.CAMPAIGNS, campaignId, name));

  await setDoc(target, {
    ...fields,
    id: target.id,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  return target.id;
}

async function putRecord(campaignId: string, name: string, id: string, updates: Record<string, unknown>): Promise<void> {
  const target = doc(db, COLLECTIONS.CAMPAIGNS, campaignId, name, id);
  await updateDoc(target, { ...updates, updated_at: serverTimestamp() });
}

async function deleteRecord(campaignId: string, name: string, id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.CAMPAIGNS, campaignId, name, id));
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
    
    const dataToStore = {
      ...details,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };
    
    await setDoc(detailsRef, dataToStore);
  },

  async getProfiles(userIds: string[]): Promise<UserProfile[]> {
    const unique = Array.from(new Set(userIds));
    const snapshots = await Promise.all(unique.map((id) => getDoc(doc(db, COLLECTIONS.USERS, id))));

    return snapshots.filter((entry) => entry.exists()).map((entry) => entry.data() as UserProfile);
  },

  async putUserSecrets(secrets: Record<string, string>): Promise<void> {
    const userId = getCurrentUserId();
    const detailsRef = doc(db, COLLECTIONS.USERS, userId, 'data', 'details');

    await setDoc(detailsRef, { ...secrets, updated_at: serverTimestamp() }, { merge: true });
  },

  async getUserDetails(userId?: string): Promise<any> {
    const uid = userId || getCurrentUserId();
    const detailsRef = doc(db, COLLECTIONS.USERS, uid, 'data', 'details');
    
    const detailsSnap = await getDoc(detailsRef);
    return detailsSnap.exists() ? detailsSnap.data() : null;
  }
};

function deleteDeadPortrait(document: CharacterDocument): void {
  const info = document.character?.info;
  if (!info?.imageUrl || !isDeadFile(info.imageUrl)) return;

  info.imageUrl = '';
  updateDoc(doc(db, COLLECTIONS.CHARACTERS, document.id), { 'character.info.imageUrl': '' }).catch(
    () => undefined
  );
}

export function getCharacterStatus(document: CharacterDocument): CharacterStatus {
  const info = document.character?.info;
  const named = Boolean(info?.name?.trim());
  const classed = Boolean(info?.class?.name) && info.class.name !== 'Unknown';
  const raced = Boolean(info?.race?.name) && info.race.name !== 'Unknown';

  return named && classed && raced ? 'ready' : 'draft';
}

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
        name: character.info?.name || 'Unnamed Character',
        level: character.info?.level || 1,
        class: character.info?.class?.name || 'Unknown',
        race: character.info?.race?.name || 'Unknown',
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
    
    characterDoc.metadata.status = getCharacterStatus(characterDoc);

    await setDoc(characterRef, characterDoc);
    return characterRef.id;
  },

  async getCharacter(characterId: string): Promise<CharacterDocument | null> {
    const characterRef = doc(db, COLLECTIONS.CHARACTERS, characterId);
    const characterSnap = await getDoc(characterRef).catch((error: FirebaseError) => {
      if (error.code !== 'permission-denied') throw error;
      return null;
    });

    if (!characterSnap?.exists()) return null;

    const document = characterSnap.data() as CharacterDocument;
    deleteDeadPortrait(document);

    return document;
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
    const found = querySnapshot.docs.map(entry => entry.data() as CharacterDocument);

    for (const document of found) {
      deleteDeadPortrait(document);

      const status = getCharacterStatus(document);
      if (document.metadata.status === status) continue;

      document.metadata.status = status;
      updateDoc(doc(db, COLLECTIONS.CHARACTERS, document.id), { 'metadata.status': status }).catch(
        () => undefined
      );
    }

    return found;
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

  async putCampaign(campaignId: string, updates: Partial<Campaign>): Promise<void> {
    const campaignRef = doc(db, COLLECTIONS.CAMPAIGNS, campaignId);
    await updateDoc(campaignRef, { ...updates, updated_at: serverTimestamp() });
  },

  async getCampaignCharacters(campaignId: string): Promise<CharacterDocument[]> {
    const charactersRef = collection(db, COLLECTIONS.CHARACTERS);
    const snapshot = await getDocs(query(charactersRef, where('campaign_id', '==', campaignId)));
    return snapshot.docs.map((entry) => entry.data() as CharacterDocument);
  },

  async getMaps(campaignId: string): Promise<CampaignMap[]> {
    const mapsRef = collection(db, COLLECTIONS.CAMPAIGNS, campaignId, COLLECTIONS.MAPS);
    const snapshot = await getDocs(mapsRef);
    return snapshot.docs.map((entry) => entry.data() as CampaignMap);
  },

  async getChartedMaps(campaigns: Campaign[], count = 12): Promise<CampaignChart[]> {
    const self = getCurrentUserId();

    const runs = await Promise.all(
      campaigns.map(async (campaign) => {
        const maps = await this.getMaps(campaign.id);
        return maps
          .filter((map) => campaign.dm_id === self || map.is_visible)
          .map((map) => ({
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            map
          }));
      })
    );

    return runs
      .flat()
      .sort((a, b) => a.map.title.localeCompare(b.map.title))
      .slice(0, count);
  },

  async postMap(campaignId: string, map: Pick<CampaignMap, 'title' | 'image_url'>): Promise<string> {
    const mapsRef = collection(db, COLLECTIONS.CAMPAIGNS, campaignId, COLLECTIONS.MAPS);
    const mapRef = doc(mapsRef);

    const document: CampaignMap = {
      id: mapRef.id,
      title: map.title,
      image_url: map.image_url,
      layers: [],
      markers: [],
      is_visible: false,
      min_zoom: 1,
      max_zoom: 8,
      created_at: serverTimestamp() as any,
      updated_at: serverTimestamp() as any
    };

    await setDoc(mapRef, document);
    return mapRef.id;
  },

  async putMap(campaignId: string, mapId: string, updates: Partial<CampaignMap>): Promise<void> {
    const mapRef = doc(db, COLLECTIONS.CAMPAIGNS, campaignId, COLLECTIONS.MAPS, mapId);
    await updateDoc(mapRef, { ...updates, updated_at: serverTimestamp() });
  },

  async deleteMap(campaignId: string, mapId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.CAMPAIGNS, campaignId, COLLECTIONS.MAPS, mapId));
  },

  postMapsListener(campaignId: string, onChange: (maps: CampaignMap[]) => void): Unsubscribe {
    const mapsRef = collection(db, COLLECTIONS.CAMPAIGNS, campaignId, COLLECTIONS.MAPS);
    return onSnapshot(mapsRef, (snapshot) => {
      onChange(snapshot.docs.map((entry) => entry.data() as CampaignMap));
    });
  },

  async getSessions(campaignId: string): Promise<CampaignSession[]> {
    const entries = await getRecords<CampaignSession>(campaignId, COLLECTIONS.SESSIONS);
    return entries.sort((a, b) => b.number - a.number);
  },

  async getRecentSessions(campaigns: Campaign[], count = 12): Promise<CampaignChronicle[]> {
    const runs = await Promise.all(
      campaigns.map(async (campaign) => {
        const sessions = await this.getSessions(campaign.id);
        return sessions.map((session) => ({
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          session
        }));
      })
    );

    return runs
      .flat()
      .sort((a, b) => b.session.played_at.localeCompare(a.session.played_at))
      .slice(0, count);
  },

  async postSession(campaignId: string, session: Partial<CampaignSession>): Promise<string> {
    return postRecord<CampaignSession>(campaignId, COLLECTIONS.SESSIONS, {
      number: session.number ?? 1,
      title: session.title ?? 'Untitled session',
      played_at: session.played_at ?? new Date().toISOString().slice(0, 10),
      summary: session.summary ?? '',
      present_character_ids: session.present_character_ids ?? []
    });
  },

  async putSession(campaignId: string, id: string, updates: Partial<CampaignSession>): Promise<void> {
    return putRecord(campaignId, COLLECTIONS.SESSIONS, id, updates);
  },

  async deleteSession(campaignId: string, id: string): Promise<void> {
    return deleteRecord(campaignId, COLLECTIONS.SESSIONS, id);
  },

  async getQuests(campaignId: string): Promise<CampaignQuest[]> {
    return getRecords<CampaignQuest>(campaignId, COLLECTIONS.QUESTS);
  },

  async getActiveQuests(campaigns: Campaign[], count = 12): Promise<CampaignErrand[]> {
    const runs = await Promise.all(
      campaigns.map(async (campaign) => {
        const quests = await this.getQuests(campaign.id);
        return quests
          .filter((quest) => quest.state === 'active')
          .map((quest) => ({
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            quest
          }));
      })
    );

    return runs.flat().slice(0, count);
  },

  async postQuest(campaignId: string, quest: Partial<CampaignQuest>): Promise<string> {
    return postRecord<CampaignQuest>(campaignId, COLLECTIONS.QUESTS, {
      title: quest.title ?? 'Untitled quest',
      description: quest.description ?? '',
      state: quest.state ?? 'active',
      level: quest.level,
      giver_npc_id: quest.giver_npc_id,
      location_id: quest.location_id,
      is_known: quest.is_known ?? false
    });
  },

  async putQuest(campaignId: string, id: string, updates: Partial<CampaignQuest>): Promise<void> {
    return putRecord(campaignId, COLLECTIONS.QUESTS, id, updates);
  },

  async deleteQuest(campaignId: string, id: string): Promise<void> {
    return deleteRecord(campaignId, COLLECTIONS.QUESTS, id);
  },

  async getNpcs(campaignId: string): Promise<CampaignNpc[]> {
    const entries = await getRecords<CampaignNpc>(campaignId, COLLECTIONS.NPCS);
    return entries.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getKnownNpcs(campaigns: Campaign[], count = 12): Promise<CampaignFigure[]> {
    const self = getCurrentUserId();

    const runs = await Promise.all(
      campaigns.map(async (campaign) => {
        const npcs = await this.getNpcs(campaign.id);
        return npcs
          .filter((npc) => campaign.dm_id === self || npc.is_known)
          .map((npc) => ({
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            npc
          }));
      })
    );

    return runs.flat().slice(0, count);
  },

  async postNpc(campaignId: string, npc: Partial<CampaignNpc>): Promise<string> {
    return postRecord<CampaignNpc>(campaignId, COLLECTIONS.NPCS, {
      name: npc.name ?? 'Unnamed',
      role: npc.role ?? '',
      description: npc.description ?? '',
      disposition: npc.disposition ?? 'unknown',
      location_id: npc.location_id,
      image_url: npc.image_url,
      stat_block_id: npc.stat_block_id,
      is_known: npc.is_known ?? false
    });
  },

  async putNpc(campaignId: string, id: string, updates: Partial<CampaignNpc>): Promise<void> {
    return putRecord(campaignId, COLLECTIONS.NPCS, id, updates);
  },

  async deleteNpc(campaignId: string, id: string): Promise<void> {
    return deleteRecord(campaignId, COLLECTIONS.NPCS, id);
  },

  async getLocations(campaignId: string): Promise<CampaignLocation[]> {
    const entries = await getRecords<CampaignLocation>(campaignId, COLLECTIONS.LOCATIONS);
    return entries.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getKnownLocations(campaigns: Campaign[], count = 12): Promise<CampaignHaunt[]> {
    const self = getCurrentUserId();

    const runs = await Promise.all(
      campaigns.map(async (campaign) => {
        const locations = await this.getLocations(campaign.id);
        return locations
          .filter((location) => campaign.dm_id === self || location.is_known)
          .map((location) => ({
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            location
          }));
      })
    );

    return runs.flat().slice(0, count);
  },

  async postLocation(campaignId: string, location: Partial<CampaignLocation>): Promise<string> {
    return postRecord<CampaignLocation>(campaignId, COLLECTIONS.LOCATIONS, {
      name: location.name ?? 'Unnamed place',
      description: location.description ?? '',
      kind: location.kind ?? 'location' as CampaignLocation['kind'],
      map_id: location.map_id,
      marker_id: location.marker_id,
      is_known: location.is_known ?? false
    });
  },

  async putLocation(campaignId: string, id: string, updates: Partial<CampaignLocation>): Promise<void> {
    return putRecord(campaignId, COLLECTIONS.LOCATIONS, id, updates);
  },

  async deleteLocation(campaignId: string, id: string): Promise<void> {
    return deleteRecord(campaignId, COLLECTIONS.LOCATIONS, id);
  },

  async getEncounters(campaignId: string): Promise<CampaignEncounter[]> {
    const entries = await getRecords<CampaignEncounter>(campaignId, COLLECTIONS.ENCOUNTERS);
    return entries.sort((a, b) => (b.created_at?.toMillis() ?? 0) - (a.created_at?.toMillis() ?? 0));
  },

  async getRecentEncounters(campaigns: Campaign[], count = 12): Promise<CampaignFray[]> {
    const self = getCurrentUserId();

    const runs = await Promise.all(
      campaigns.map(async (campaign) => {
        const encounters = await this.getEncounters(campaign.id);
        return encounters
          .filter((encounter) => campaign.dm_id === self || encounter.is_known)
          .map((encounter) => ({
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            encounter
          }));
      })
    );

    return runs
      .flat()
      .sort((a, b) => (b.encounter.created_at?.toMillis() ?? 0) - (a.encounter.created_at?.toMillis() ?? 0))
      .slice(0, count);
  },

  async postEncounter(campaignId: string, encounter: Partial<CampaignEncounter>): Promise<string> {
    return postRecord<CampaignEncounter>(campaignId, COLLECTIONS.ENCOUNTERS, {
      title: encounter.title ?? 'Untitled encounter',
      combatants: encounter.combatants ?? [],
      round: encounter.round ?? 1,
      turn: encounter.turn ?? 0,
      is_active: encounter.is_active ?? false,
      is_known: encounter.is_known ?? false
    });
  },

  async putEncounter(campaignId: string, id: string, updates: Partial<CampaignEncounter>): Promise<void> {
    return putRecord(campaignId, COLLECTIONS.ENCOUNTERS, id, updates);
  },

  async deleteEncounter(campaignId: string, id: string): Promise<void> {
    return deleteRecord(campaignId, COLLECTIONS.ENCOUNTERS, id);
  },

  postEncountersListener(
    campaignId: string,
    onChange: (encounters: CampaignEncounter[]) => void
  ): Unsubscribe {
    const encounters = collection(db, COLLECTIONS.CAMPAIGNS, campaignId, COLLECTIONS.ENCOUNTERS);
    return onSnapshot(
      encounters,
      (snapshot) => onChange(snapshot.docs.map((entry) => entry.data() as CampaignEncounter)),
      (error) => console.error('Campaign encounters did not stream:', error)
    );
  },

  async getChatEntries(campaignId: string): Promise<CampaignChatEntry[]> {
    const entries = await getRecords<CampaignChatEntry>(campaignId, COLLECTIONS.CHAT);
    return entries.sort((a, b) => (a.created_at?.toMillis() ?? 0) - (b.created_at?.toMillis() ?? 0));
  },

  async postChatEntry(
    campaignId: string,
    entry: Omit<CampaignChatEntry, 'id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    return postRecord<CampaignChatEntry>(campaignId, COLLECTIONS.CHAT, entry);
  },

  postChatListener(campaignId: string, onChange: (entries: CampaignChatEntry[]) => void): Unsubscribe {
    const entries = query(
      collection(db, COLLECTIONS.CAMPAIGNS, campaignId, COLLECTIONS.CHAT),
      orderBy('created_at')
    );

    return onSnapshot(
      entries,
      (snapshot) => onChange(snapshot.docs.map((entry) => entry.data() as CampaignChatEntry)),
      (error) => console.error('Campaign chat did not stream:', error)
    );
  },

  async getPartyMembers(campaigns: Campaign[]): Promise<PartyMember[]> {
    const self = getCurrentUserId();
    const seats = campaigns.flatMap((campaign) =>
      [campaign.dm_id, ...campaign.player_ids]
        .filter((uid) => uid !== self)
        .map((uid) => ({
          uid,
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          is_dm: uid === campaign.dm_id
        }))
    );

    const profiles = await userService.getProfiles(seats.map((seat) => seat.uid));
    const byUid = new Map(profiles.map((profile) => [profile.uid, profile]));
    const taken = new Set<string>();

    return seats.flatMap((seat) => {
      const profile = byUid.get(seat.uid);
      if (!profile || taken.has(seat.uid)) return [];
      taken.add(seat.uid);

      return [{ profile, campaign_id: seat.campaign_id, campaign_name: seat.campaign_name, is_dm: seat.is_dm }];
    });
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
