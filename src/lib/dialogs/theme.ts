import { writable } from 'svelte/store';

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
  { id: 'medieval', name: 'Fantasy Medieval', description: 'Gold and bronze mystical realm', colors: ['#ffd700', '#ff6b35', '#8b5a2b'] },
  { id: 'forest', name: 'Mystic Forest', description: 'Enchanted woodland greens', colors: ['#00ff88', '#66d9aa', '#2d5a3d'] },
  { id: 'fire', name: 'Dragon Fire', description: 'Burning crimson flames', colors: ['#ff4444', '#ffaa22', '#8b0000'] },
  { id: 'arcane', name: 'Arcane Magic', description: 'Purple mystical energies', colors: ['#aa44ff', '#6644ff', '#2d1b69'] },
  { id: 'ocean', name: 'Ocean Depths', description: 'Deep blue mysteries', colors: ['#00aaff', '#00ffdd', '#1e3a8a'] }
];

export function getTheme(): string {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved && availableThemes.some((theme) => theme.id === saved)) return saved;
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
