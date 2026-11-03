import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../firestore.types';

export const user = writable<User | null>(null);
export const userProfile = writable<UserProfile | null>(null);
export const userDetails = writable<any>(null);
export const isLoading = writable(true);
export const authError = writable<string | null>(null);

export const isAuthenticated = writable(false);

user.subscribe(($user) => {
  isAuthenticated.set(!!$user);
});