import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe
} from 'firebase/auth';
import { auth } from './firebase';
import { userService } from './firestore.service';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, displayName: string, replicateApiKey: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    try {
      await userService.createProfile({
        email,
        display_name: displayName,
        photo_url: user.photoURL || undefined,
        replicate_api_key: replicateApiKey
      });

      console.log('Auth Service: Storing user details:', {
        display_name: displayName,
        replicate_api_key: replicateApiKey
      });
      
      await userService.setUserDetails(user.uid, {
        display_name: displayName,
        replicate_api_key: replicateApiKey
      });
      
      console.log('Auth Service: User details stored successfully');
      
      const savedDetails = await userService.getUserDetails(user.uid);
      if (!savedDetails || !savedDetails.display_name) {
        throw new Error('Failed to save user details - verification failed');
      }
      
      console.log('Auth Service: Verified user details:', savedDetails);
      
    } catch (error) {
      console.error('Auth Service: Failed to save user data, deleting auth user:', error);
      try {
        await user.delete();
      } catch (deleteError) {
        console.error('Auth Service: Failed to delete user after data save failure:', deleteError);
      }
      throw new Error(`Account creation failed: ${error instanceof Error ? error.message : 'Failed to save user details'}`);
    }
    
    return user;
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  // Sign in with Google
  async signInWithGoogle(): Promise<User> {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user profile exists, create if not
    const existingProfile = await userService.getProfile(user.uid);
    if (!existingProfile) {
      await userService.createProfile({
        email: user.email || '',
        display_name: user.displayName || '',
        photo_url: user.photoURL || undefined
      });
    }
    
    return user;
  },

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  // Subscribe to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, callback);
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }
};