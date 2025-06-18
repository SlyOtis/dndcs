import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
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
  currentCharacterId
} from './stores/character.store';
import { 
  userCampaigns, 
  currentCampaign, 
  currentCampaignId
} from './stores/campaign.store';

export function initializeAuth() {
  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    isLoading.set(true);
    
    try {
      if (firebaseUser) {
        // User is signed in
        user.set(firebaseUser);
        isAuthenticated.set(true);
        
        // Initialize user profile
        userProfile.set({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || undefined
        });
        
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