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
  arrayUnion,
  arrayRemove,
  deleteField,
  type Unsubscribe
} from 'firebase/firestore';
import type { FirebaseError } from 'firebase/app';
import { auth, db } from './firebase';
import { deleteFile, isDeadFile, isStoredFile } from './storage.service';
import type {
  UserProfile,
  Campaign,
  CampaignChatEntry,
  CampaignEncounter,
  CampaignMap,
  CharacterDocument,
  CharacterMetadata,
  CharacterStatus,
  UserPreferences,
  Party,
  Owner,
  Song
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

async function getRecords<T extends CampaignRecord>(owner: Owner, name: string): Promise<T[]> {
  const rows = collection(db, owner.at, owner.id, name);
  const mine = query(rows, where('readers', 'array-contains', getCurrentUserId()));
  const snapshot = await getDocs(mine);
  return snapshot.docs.map((entry) => entry.data() as T);
}

async function postRecord<T extends CampaignRecord>(
  owner: Owner,
  name: string,
  fields: Omit<T, 'id' | 'owner_id' | 'readers' | 'created_at' | 'updated_at'> & { readers?: string[] }
): Promise<string> {
  const target = doc(collection(db, owner.at, owner.id, name));
  const self = getCurrentUserId();
  const asked = fields.readers ?? [];

  await setDoc(target, {
    ...fields,
    id: target.id,
    owner_id: self,
    readers: [...new Set([self, ...asked])],
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  return target.id;
}

async function putRecord(owner: Owner, name: string, id: string, updates: Record<string, unknown>): Promise<void> {
  const target = doc(db, owner.at, owner.id, name, id);
  await updateDoc(target, { ...updates, updated_at: serverTimestamp() });
}

async function deleteRecord(owner: Owner, name: string, id: string): Promise<void> {
  await deleteDoc(doc(db, owner.at, owner.id, name, id));
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
      friends: [],
      created_at: serverTimestamp() as any,
      updated_at: serverTimestamp() as any,
      preferences: {
        theme: 'medieval',
        sound_enabled: true,
        sound_volume: 0.7,
        animations_enabled: true,
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

  async putRecentCharacters(recent: string[]): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, getCurrentUserId());

    await updateDoc(userRef, {
      'preferences.recent_characters': recent,
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

  async getProfileEmail(email: string): Promise<UserProfile | null> {
    const users = collection(db, COLLECTIONS.USERS);
    const snapshot = await getDocs(query(users, where('email', '==', email.trim().toLowerCase()), limit(1)));

    return snapshot.empty ? null : (snapshot.docs[0].data() as UserProfile);
  },

  async getProfiles(userIds: string[]): Promise<UserProfile[]> {
    const unique = Array.from(new Set(userIds));
    const snapshots = await Promise.all(unique.map((id) => getDoc(doc(db, COLLECTIONS.USERS, id))));

    return snapshots.filter((entry) => entry.exists()).map((entry) => entry.data() as UserProfile);
  },

  async postFriend(email: string): Promise<UserProfile> {
    const userId = getCurrentUserId();
    const found = await this.getProfileEmail(email);
    if (!found) throw new Error('Nobody signs in with that address.');
    if (found.uid === userId) throw new Error('That address is your own.');

    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      friends: arrayUnion(found.uid),
      updated_at: serverTimestamp()
    });

    return found;
  },

  async deleteFriend(friendId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.USERS, getCurrentUserId()), {
      friends: arrayRemove(friendId),
      updated_at: serverTimestamp()
    });
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

export function getCharacterStatus(character: Character): CharacterStatus {
  const info = character?.info;
  const named = Boolean(info?.name?.trim());
  const classed = Boolean(info?.class?.name) && info.class.name !== 'Unknown';
  const raced = Boolean(info?.race?.name) && info.race.name !== 'Unknown';

  return named && classed && raced ? 'ready' : 'draft';
}

export type DerivedMetadata = Pick<CharacterMetadata, 'name' | 'level' | 'class' | 'race' | 'status'>;

export function getCharacterMetadata(character: Character): DerivedMetadata {
  const info = character?.info;

  return {
    name: info?.name?.trim() || 'Unnamed Character',
    level: info?.level || 1,
    class: info?.class?.name || 'Unknown',
    race: info?.race?.name || 'Unknown',
    status: getCharacterStatus(character)
  };
}

function getMetadataFields(metadata: DerivedMetadata): Record<string, unknown> {
  return Object.fromEntries(Object.entries(metadata).map(([key, value]) => [`metadata.${key}`, value]));
}

// Character Operations
export const characterService = {
  async createCharacter(
    character: Character,
    metadata?: Partial<CharacterDocument['metadata']>,
    campaignId?: string
  ): Promise<string> {
    const userId = getCurrentUserId();
    const characterRef = doc(collection(db, COLLECTIONS.CHARACTERS));

    const characterDoc: CharacterDocument = {
      id: characterRef.id,
      owner_id: userId,
      ...(campaignId ? { campaign_id: campaignId } : {}),
      character,
      metadata: {
        ...getCharacterMetadata(character),
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
    const characterSnap = await getDoc(characterRef).catch((error: FirebaseError) => {
      if (error.code !== 'permission-denied') throw error;
      return null;
    });

    if (!characterSnap?.exists()) return null;

    const document = characterSnap.data() as CharacterDocument;
    deleteDeadPortrait(document);

    return document;
  },

  async putPlayed(characterId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.CHARACTERS, characterId), {
      'metadata.last_played_at': serverTimestamp()
    });
  },

  async updateCharacter(characterId: string, character: Character): Promise<void> {
    const characterRef = doc(db, COLLECTIONS.CHARACTERS, characterId);
    
    await updateDoc(characterRef, {
      character,
      ...getMetadataFields(getCharacterMetadata(character)),
      'metadata.updated_at': serverTimestamp(),
      'metadata.last_played_at': serverTimestamp()
    });
  },

  async postCharacterCopy(characterId: string): Promise<string> {
    const document = await this.getCharacter(characterId);
    if (!document) throw new Error('That character is gone, so there is nothing to copy.');

    const character: Character = {
      ...document.character,
      info: { ...document.character.info, name: `${document.character.info.name} (copy)` }
    };

    const copyId = await this.createCharacter(
      character,
      { tags: document.metadata.tags ?? [], is_template: false },
      document.campaign_id
    );

    if (document.owner_id !== getCurrentUserId()) return copyId;

    const sources = await this.getCharacterSources(characterId);
    if (sources.length > 0) await this.setCharacterSources(copyId, sources);

    return copyId;
  },

  async deleteCharacter(characterId: string): Promise<void> {
    const characterRef = doc(db, COLLECTIONS.CHARACTERS, characterId);
    const held = await getDocs(collection(db, COLLECTIONS.CHARACTERS, characterId, 'data'));

    await Promise.all(held.docs.map((entry) => deleteDoc(entry.ref)));
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

      const derived = getCharacterMetadata(document.character);
      const stale = (Object.keys(derived) as (keyof DerivedMetadata)[]).some(
        (key) => document.metadata[key] !== derived[key]
      );
      if (!stale) continue;

      document.metadata = { ...document.metadata, ...derived };
      updateDoc(doc(db, COLLECTIONS.CHARACTERS, document.id), getMetadataFields(derived)).catch(
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
  }
};

// Party Operations
export const partyService = {
  async postParty(fields: Omit<Party, 'id' | 'owner_id' | 'created_at' | 'updated_at'>): Promise<string> {
    const target = doc(collection(db, COLLECTIONS.PARTIES));

    await setDoc(target, {
      ...fields,
      id: target.id,
      owner_id: getCurrentUserId(),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    return target.id;
  },

  async getParty(partyId: string): Promise<Party | null> {
    const snapshot = await getDoc(doc(db, COLLECTIONS.PARTIES, partyId));
    return snapshot.exists() ? (snapshot.data() as Party) : null;
  },

  async getParties(): Promise<Party[]> {
    const parties = collection(db, COLLECTIONS.PARTIES);
    const snapshot = await getDocs(query(parties, where('member_ids', 'array-contains', getCurrentUserId())));
    return snapshot.docs.map((entry) => entry.data() as Party).sort((a, b) => a.name.localeCompare(b.name));
  },

  async putParty(partyId: string, updates: Partial<Party>): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.PARTIES, partyId), { ...updates, updated_at: serverTimestamp() });
  },

  async deleteParty(partyId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.PARTIES, partyId));
  },

  async postPartyCharacter(partyId: string, characterId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.PARTIES, partyId), {
      character_ids: arrayUnion(characterId),
      updated_at: serverTimestamp()
    });
  },

  async deletePartyCharacter(partyId: string, characterId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.PARTIES, partyId), {
      character_ids: arrayRemove(characterId),
      updated_at: serverTimestamp()
    });
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

  async deleteCampaign(campaignId: string): Promise<void> {
    const self = getCurrentUserId();
    const owner: Owner = { at: COLLECTIONS.CAMPAIGNS, id: campaignId };
    const [maps, encounters, chat, songs, characters] = await Promise.all([
      this.getMaps(campaignId),
      getDocs(collection(db, COLLECTIONS.CAMPAIGNS, campaignId, COLLECTIONS.ENCOUNTERS)),
      getDocs(query(collection(db, COLLECTIONS.CAMPAIGNS, campaignId, COLLECTIONS.CHAT), where('author_id', '==', self))),
      getRecords<Song>(owner, COLLECTIONS.SONGS),
      this.getCampaignCharacters(campaignId)
    ]);

    const addresses = [
      ...maps.flatMap((map) => [map.image_url, ...map.layers.map((layer) => layer.image_url)]),
      ...songs.filter((song) => song.owner_id === self).map((song) => song.address)
    ].filter(isStoredFile);

    await Promise.all([
      ...addresses.map((address) => deleteFile(address)),
      ...maps.map((map) => this.deleteMap(campaignId, map.id)),
      ...encounters.docs.map((entry) => deleteDoc(entry.ref)),
      ...chat.docs.map((entry) => deleteDoc(entry.ref)),
      ...songs.filter((song) => song.owner_id === self).map((song) => deleteRecord(owner, COLLECTIONS.SONGS, song.id)),
      ...characters.map((character) => this.deleteCampaignCharacter(campaignId, character.id))
    ]);

    await deleteDoc(doc(db, COLLECTIONS.CAMPAIGNS, campaignId));
  },

  async postCampaignPlayer(campaignId: string, email: string): Promise<UserProfile> {
    const found = await userService.getProfileEmail(email);
    if (!found) throw new Error('Nobody signs in with that address.');

    const campaign = await this.getCampaign(campaignId);
    if (campaign?.dm_id === found.uid) throw new Error('That is the dungeon master.');
    if (campaign?.player_ids.includes(found.uid)) throw new Error('They are already at the table.');

    await updateDoc(doc(db, COLLECTIONS.CAMPAIGNS, campaignId), {
      player_ids: arrayUnion(found.uid),
      updated_at: serverTimestamp()
    });

    return found;
  },

  async deleteCampaignPlayer(campaignId: string, playerId: string): Promise<void> {
    const characters = await this.getCampaignCharacters(campaignId);
    await Promise.all(
      characters
        .filter((character) => character.owner_id === playerId)
        .map((character) => this.deleteCampaignCharacter(campaignId, character.id))
    );

    await updateDoc(doc(db, COLLECTIONS.CAMPAIGNS, campaignId), {
      player_ids: arrayRemove(playerId),
      updated_at: serverTimestamp()
    });
  },

  async postCampaignCharacter(campaignId: string, characterId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.CHARACTERS, characterId), { campaign_id: campaignId });
    await updateDoc(doc(db, COLLECTIONS.CAMPAIGNS, campaignId), {
      character_ids: arrayUnion(characterId),
      updated_at: serverTimestamp()
    });
  },

  async deleteCampaignCharacter(campaignId: string, characterId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.CAMPAIGNS, campaignId), {
      character_ids: arrayRemove(characterId),
      updated_at: serverTimestamp()
    });
    await updateDoc(doc(db, COLLECTIONS.CHARACTERS, characterId), { campaign_id: deleteField() });
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

  postSongsListener(campaignId: string, onChange: (songs: Song[]) => void): Unsubscribe {
    const songs = query(
      collection(db, COLLECTIONS.CAMPAIGNS, campaignId, COLLECTIONS.SONGS),
      where('readers', 'array-contains', getCurrentUserId())
    );

    return onSnapshot(
      songs,
      (snapshot) => onChange(snapshot.docs.map((entry) => entry.data() as Song)),
      (error) => console.error('Campaign songs did not stream:', error)
    );
  },

  async getPart<T extends CampaignRecord>(owner: Owner, part: string): Promise<T[]> {
    const entries = await getRecords<T>(owner, part);
    return entries.sort((a, b) =>
      String((a as Record<string, unknown>).title ?? (a as Record<string, unknown>).name ?? '').localeCompare(
        String((b as Record<string, unknown>).title ?? (b as Record<string, unknown>).name ?? '')
      )
    );
  },

  async postPart(owner: Owner, part: string, values: Record<string, unknown>): Promise<string> {
    return postRecord(owner, part, values as never);
  },

  async putPart(owner: Owner, part: string, id: string, values: Record<string, unknown>): Promise<void> {
    return putRecord(owner, part, id, values);
  },

  async deletePart(owner: Owner, part: string, id: string): Promise<void> {
    return deleteRecord(owner, part, id);
  },

  async getEncounters(campaignId: string): Promise<CampaignEncounter[]> {
    const entries = await getRecords<CampaignEncounter>({ at: COLLECTIONS.CAMPAIGNS, id: campaignId }, COLLECTIONS.ENCOUNTERS);
    return entries.sort((a, b) => (b.created_at?.toMillis() ?? 0) - (a.created_at?.toMillis() ?? 0));
  },

  async postEncounter(campaignId: string, encounter: Partial<CampaignEncounter>): Promise<string> {
    return postRecord<CampaignEncounter>({ at: COLLECTIONS.CAMPAIGNS, id: campaignId }, COLLECTIONS.ENCOUNTERS, {
      title: encounter.title ?? 'Untitled encounter',
      combatants: encounter.combatants ?? [],
      round: encounter.round ?? 1,
      turn: encounter.turn ?? 0,
      is_active: encounter.is_active ?? false,
      share_campaigns: encounter.share_campaigns ?? [],
      share_parties: encounter.share_parties ?? [],
      share_users: encounter.share_users ?? [],
      readers: encounter.readers ?? []
    });
  },

  async putEncounter(campaignId: string, id: string, updates: Partial<CampaignEncounter>): Promise<void> {
    return putRecord({ at: COLLECTIONS.CAMPAIGNS, id: campaignId }, COLLECTIONS.ENCOUNTERS, id, updates);
  },

  async deleteEncounter(campaignId: string, id: string): Promise<void> {
    return deleteRecord({ at: COLLECTIONS.CAMPAIGNS, id: campaignId }, COLLECTIONS.ENCOUNTERS, id);
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

  async postChatEntry(
    campaignId: string,
    entry: Omit<CampaignChatEntry, 'id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    return postRecord<CampaignChatEntry>({ at: COLLECTIONS.CAMPAIGNS, id: campaignId }, COLLECTIONS.CHAT, entry);
  },

  postChatListener(campaignId: string, onChange: (entries: CampaignChatEntry[]) => void): Unsubscribe {
    let stop: Unsubscribe | null = null;
    let closed = false;

    getDoc(doc(db, COLLECTIONS.CAMPAIGNS, campaignId))
      .then((campaign) => {
        if (closed) return;
        const isDm = campaign.data()?.dm_id === getCurrentUserId();
        const entries = query(
          collection(db, COLLECTIONS.CAMPAIGNS, campaignId, COLLECTIONS.CHAT),
          ...(isDm ? [] : [where('is_hidden', '==', false)]),
          orderBy('created_at')
        );

        stop = onSnapshot(
          entries,
          (snapshot) => onChange(snapshot.docs.map((entry) => entry.data() as CampaignChatEntry)),
          (error) => console.error('Campaign chat did not stream:', error)
        );
      })
      .catch((error) => console.error('Campaign chat did not stream:', error));

    return () => {
      closed = true;
      stop?.();
    };
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

