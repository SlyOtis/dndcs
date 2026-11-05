import { writable } from 'svelte/store';
import type { SessionUser } from '../api';
import type { UserProfile } from '../firestore.types';

export const user = writable<SessionUser | null>(null);
export const userProfile = writable<UserProfile | null>(null);
export const userDetails = writable<any>(null);
export const isLoading = writable(true);
export const authError = writable<string | null>(null);

export const isAuthenticated = writable(false);

user.subscribe(($user) => {
  isAuthenticated.set(!!$user);
});
