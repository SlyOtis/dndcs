import { ApiError, getApi, getSession, putSession, type SessionUser } from './api';
import { userService } from './firestore.service';

interface SamnaMe {
  user_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  user_name?: string;
  user_image?: string;
}

const listeners = new Set<(user: SessionUser | null) => void>();

function getSignInAddress(): string {
  const back = window.location.pathname + window.location.search;
  return `/api/auth/login?next=${encodeURIComponent(back === '/login' || back === '/signup' ? '/' : back)}`;
}

function getSessionUser(me: SamnaMe): SessionUser {
  const name = [me.first_name, me.last_name].filter(Boolean).join(' ') || me.user_name || me.email || '';
  return { uid: me.user_id, email: me.email ?? '', display_name: name, photo_url: me.user_image ?? '' };
}

export const authService = {
  async signUp(_email: string, _password: string, _displayName: string, replicateApiKey = ''): Promise<SessionUser> {
    if (replicateApiKey) sessionStorage.setItem('dndcs.replicate_api_key', replicateApiKey);
    window.location.assign(getSignInAddress());
    return new Promise<SessionUser>(() => undefined);
  },

  async signIn(_email: string, _password: string): Promise<SessionUser> {
    window.location.assign(getSignInAddress());
    return new Promise<SessionUser>(() => undefined);
  },

  async signInWithGoogle(): Promise<SessionUser> {
    window.location.assign(getSignInAddress());
    return new Promise<SessionUser>(() => undefined);
  },

  async signOut(): Promise<void> {
    putSession(null);
    listeners.forEach((listener) => listener(null));
    window.location.assign('/api/auth/logout');
  },

  async getSessionUser(): Promise<SessionUser | null> {
    const me = await getApi<SamnaMe>('/auth/me').catch((error) => {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
      throw error;
    });
    const found = me?.user_id ? getSessionUser(me) : null;
    putSession(found);

    if (found) {
      const profile = await userService.getProfile();
      if (!profile) {
        await userService.createProfile({ email: found.email, display_name: found.display_name, photo_url: found.photo_url });
      }
      const pendingKey = sessionStorage.getItem('dndcs.replicate_api_key');
      if (pendingKey) {
        await userService.putUserSecrets({ replicate_api_key: pendingKey });
        sessionStorage.removeItem('dndcs.replicate_api_key');
      }
    }

    return found;
  },

  getCurrentUser(): SessionUser | null {
    return getSession();
  },

  onAuthStateChanged(callback: (user: SessionUser | null) => void): () => void {
    listeners.add(callback);
    this.getSessionUser()
      .then((found) => callback(found))
      .catch(() => callback(null));
    return () => listeners.delete(callback);
  },

  isAuthenticated(): boolean {
    return !!getSession();
  }
};
