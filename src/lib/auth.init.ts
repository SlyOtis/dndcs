import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { authService } from './auth.service';
import { userService, characterService, campaignService } from './firestore.service';
import { 
  user, 
  userProfile, 
  isLoading, 
  authError, 
  isAuthenticated 
} from './stores/auth.store';
import { 
  userCharacters, 
  currentCharacter, 
  currentCharacterId,
  currentCharacterDoc,
  isLoadingCharacter,
  enableAutoSave,
  disableAutoSave
} from './stores/character.store';
import { 
  userCampaigns, 
  currentCampaign, 
  currentCampaignId,
  isLoadingCampaigns
} from './stores/campaign.store';

let unsubscribeProfile: (() => void) | null = null;
let unsubscribeCharacters: (() => void) | null = null;
let unsubscribeCampaigns: (() => void) | null = null;

export function initializeAuth() {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      isLoading.set(true);
      authError.set(null);

      if (firebaseUser) {
        user.set(firebaseUser);
        isAuthenticated.set(true);

        // Subscribe to user profile
        unsubscribeProfile = userService.subscribeToProfile((profile) => {
          userProfile.set(profile);
        });

        // Subscribe to user characters
        unsubscribeCharacters = characterService.subscribeToUserCharacters((characters) => {
          userCharacters.set(characters);
        });

        // Subscribe to user campaigns
        unsubscribeCampaigns = campaignService.subscribeToUserCampaigns((campaigns) => {
          userCampaigns.set(campaigns);
        });

        // Load user profile if it doesn't exist
        const profile = await userService.getProfile();
        if (!profile) {
          await userService.createProfile({
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || undefined
          });
        }

      } else {
        // User is signed out
        user.set(null);
        userProfile.set(null);
        isAuthenticated.set(false);
        
        // Clear all user data
        userCharacters.set([]);
        userCampaigns.set([]);
        currentCharacter.set(null);
        currentCharacterId.set(null);
        currentCharacterDoc.set(null);
        currentCampaign.set(null);
        currentCampaignId.set(null);

        // Unsubscribe from all Firebase listeners
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        if (unsubscribeCharacters) {
          unsubscribeCharacters();
          unsubscribeCharacters = null;
        }
        if (unsubscribeCampaigns) {
          unsubscribeCampaigns();
          unsubscribeCampaigns = null;
        }

        // Disable auto-save
        disableAutoSave();
      }
    } catch (error) {
      console.error('Auth state change error:', error);
      authError.set(error instanceof Error ? error.message : 'Authentication error');
    } finally {
      isLoading.set(false);
    }
  });
}

// Character management functions
export async function loadCharacter(characterId: string) {
  try {
    isLoadingCharacter.set(true);
    const characterDoc = await characterService.getCharacter(characterId);
    
    if (characterDoc) {
      currentCharacterDoc.set(characterDoc);
      currentCharacter.set(characterDoc.character);
      currentCharacterId.set(characterId);
      
      // Enable auto-save for this character
      enableAutoSave(characterId, async (character) => {
        await characterService.updateCharacter(characterId, character);
      });
    }
  } catch (error) {
    console.error('Error loading character:', error);
    authError.set(error instanceof Error ? error.message : 'Failed to load character');
  } finally {
    isLoadingCharacter.set(false);
  }
}

export async function saveCharacter() {
  const characterId = currentCharacterId.subscribe(id => id)();
  const character = currentCharacter.subscribe(char => char)();
  
  if (!characterId || !character) return;
  
  try {
    await characterService.updateCharacter(characterId, character);
  } catch (error) {
    console.error('Error saving character:', error);
    authError.set(error instanceof Error ? error.message : 'Failed to save character');
  }
}

export async function createNewCharacter(character: any) {
  try {
    const characterId = await characterService.createCharacter(character);
    await loadCharacter(characterId);
    return characterId;
  } catch (error) {
    console.error('Error creating character:', error);
    authError.set(error instanceof Error ? error.message : 'Failed to create character');
    throw error;
  }
}

// Campaign management functions
export async function loadCampaign(campaignId: string) {
  try {
    isLoadingCampaigns.set(true);
    const campaign = await campaignService.getCampaign(campaignId);
    
    if (campaign) {
      currentCampaign.set(campaign);
      currentCampaignId.set(campaignId);
    }
  } catch (error) {
    console.error('Error loading campaign:', error);
    authError.set(error instanceof Error ? error.message : 'Failed to load campaign');
  } finally {
    isLoadingCampaigns.set(false);
  }
}

export async function createNewCampaign(campaignData: any) {
  try {
    const campaignId = await campaignService.createCampaign(campaignData);
    await loadCampaign(campaignId);
    return campaignId;
  } catch (error) {
    console.error('Error creating campaign:', error);
    authError.set(error instanceof Error ? error.message : 'Failed to create campaign');
    throw error;
  }
}