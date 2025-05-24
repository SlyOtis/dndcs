import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../firestore.types';

// Auth state
export const user = writable<User | null>(null);
export const userProfile = writable<UserProfile | null>(null);
export const isLoading = writable(true);
export const authError = writable<string | null>(null);

// Helper to check if user is authenticated
export const isAuthenticated = writable(false);

// Update authentication status when user changes
user.subscribe(($user) => {
  isAuthenticated.set(!!$user);
});