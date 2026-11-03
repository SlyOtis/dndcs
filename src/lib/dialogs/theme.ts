import { get, writable } from 'svelte/store';
import { userProfile } from '../stores/auth.store';

const THEME_KEY = 'dnd_theme';
const DEFAULT_THEME = 'medieval';

export interface ThemeOption {
  id: string;
  name: string;
  description: string;
  colors: string[];
}

export interface ThemeState {
  isOpen: boolean;
  currentTheme: string;
}

export const availableThemes: ThemeOption[] = [
  { id: 'medieval', name: 'Alliance', description: 'Carved granite, gilded trim and torchlight', colors: ['#d4a445', '#ff9f2e', '#4a4034'] },
  { id: 'forest', name: 'Night Elf', description: 'Moonlit violet wood and silver leaf', colors: ['#b39be6', '#7fe6d4', '#2c1f3d'] },
  { id: 'fire', name: 'Horde', description: 'Scorched timber, riveted iron and war paint', colors: ['#c2874a', '#ff4a1c', '#452414'] },
  { id: 'arcane', name: 'Scourge', description: 'Bone, black iron and plague light', colors: ['#cfc6a2', '#8fe04a', '#383c32'] },
  { id: 'ocean', name: 'Frozen Throne', description: 'Rimed steel under a cold glow', colors: ['#9ccbe6', '#6fdcff', '#2f3c48'] }
];

export function getTheme(): string {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved && availableThemes.some((theme) => theme.id === saved)) return saved;
  return getDefaultTheme();
}

export function getDefaultTheme(): string {
  const held = get(userProfile)?.preferences?.theme;
  if (held && availableThemes.some((theme) => theme.id === held)) return held;
  return DEFAULT_THEME;
}

export function setTheme(id: string): void {
  const theme = availableThemes.some((candidate) => candidate.id === id) ? id : DEFAULT_THEME;
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute('data-theme', theme);
}

export function createThemeStore() {
  const state = writable<ThemeState>({
    isOpen: false,
    currentTheme: getTheme()
  });

  return {
    ...state,

    open() {
      state.update(s => ({ ...s, isOpen: true }));
    },

    close() {
      state.update(s => ({ ...s, isOpen: false }));
    },

    setTheme(id: string) {
      setTheme(id);
      state.update(s => ({ ...s, currentTheme: getTheme() }));
    }
  };
}
