import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe
} from 'firebase/auth';
import { auth } from './firebase';
import { userService } from './firestore.service';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, displayName: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile in Firestore
    await userService.createProfile({
      email,
      displayName,
      photoURL: user.photoURL || undefined
    });
    
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
        displayName: user.displayName || '',
        photoURL: user.photoURL || undefined
      });
    }
    
    return user;
  },

  // Sign out
  async signOut(): Promise<void> {
    await signOut(auth);
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