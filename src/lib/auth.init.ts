import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import { 
  user, 
  userProfile,
  userDetails, 
  isLoading, 
  authError, 
  isAuthenticated 
} from './stores/auth.store';
import { 
  userCharacters, 
  currentCharacter, 
  currentCharacterId
} from './stores/character.store';
import { 
  userCampaigns, 
  currentCampaign, 
  currentCampaignId
} from './stores/campaign.store';
import { userService, characterService, campaignService } from './firestore.service';

export function initializeAuth() {
  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    isLoading.set(true);
    
    try {
      if (firebaseUser) {
        user.set(firebaseUser);
        isAuthenticated.set(true);
        
        try {
          const [profile, details] = await Promise.all([
            userService.getProfile(firebaseUser.uid),
            userService.getUserDetails(firebaseUser.uid)
          ]);
          
          if (profile) {
            userProfile.set(profile);
          }
          
          if (details) {
            userDetails.set(details);
            console.log('Auth init: User details loaded:', details);
          } else {
            console.error('Auth init: No user details found for user:', firebaseUser.uid);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
        
      } else {
        user.set(null);
        userProfile.set(null);
        userDetails.set(null);
        isAuthenticated.set(false);
        
        userCharacters.set([]);
        userCampaigns.set([]);
        currentCharacter.set(null);
        currentCharacterId.set(null);
        currentCampaign.set(null);
        currentCampaignId.set(null);
      }
      
      authError.set(null);
    } catch (error) {
      console.error('Auth state change error:', error);
      authError.set(error instanceof Error ? error.message : 'Authentication error');
    } finally {
      isLoading.set(false);
    }
  });
}