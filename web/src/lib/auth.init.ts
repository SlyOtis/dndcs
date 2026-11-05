import type { SessionUser } from './api';
import { authService } from './auth.service';
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
import { userService, type Unsubscribe } from './firestore.service';

export function initializeAuth() {
  let unsubscribeProfile: Unsubscribe | null = null;

  const unsubscribeAuth = authService.onAuthStateChanged(async (sessionUser: SessionUser | null) => {
    isLoading.set(true);

    unsubscribeProfile?.();
    unsubscribeProfile = null;

    try {
      if (sessionUser) {
        user.set(sessionUser);
        isAuthenticated.set(true);

        try {
          let settle: () => void = () => {};
          const firstProfile = new Promise<void>((resolve) => (settle = resolve));

          unsubscribeProfile = userService.subscribeToProfile((profile) => {
            if (profile) userProfile.set(profile);
            settle();
          });

          const [details] = await Promise.all([userService.getUserDetails(sessionUser.uid), firstProfile]);

          userDetails.set(details ?? {});
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
