import { onAuthStateChanged, type User } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';
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
  currentCharacterId
} from './stores/character.store';
import { 
  userCampaigns, 
  currentCampaign, 
  currentCampaignId
} from './stores/campaign.store';
import { userService, characterService, campaignService } from './firestore.service';

export function initializeAuth() {
  let unsubscribeProfile: Unsubscribe | null = null;

  const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    isLoading.set(true);

    unsubscribeProfile?.();
    unsubscribeProfile = null;

    try {
      if (firebaseUser) {
        user.set(firebaseUser);
        isAuthenticated.set(true);

        try {
          let settle: () => void = () => {};
          const firstProfile = new Promise<void>((resolve) => (settle = resolve));

          unsubscribeProfile = userService.subscribeToProfile((profile) => {
            if (profile) userProfile.set(profile);
            settle();
          });

          const [details] = await Promise.all([
            userService.getUserDetails(firebaseUser.uid),
            firstProfile
          ]);

          if (details) {
            userDetails.set(details);
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

  return () => {
    unsubscribeProfile?.();
    unsubscribeAuth();
  };
}
