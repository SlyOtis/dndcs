import { writable } from 'svelte/store';

export interface ThemeState {
  isOpen: boolean;
  currentTheme: string;
}

export function createThemeStore() {
  const state = writable<ThemeState>({ 
    isOpen: false, 
    currentTheme: localStorage.getItem('app_theme') || 'default' 
  });

  return {
    ...state,
    
    open() {
      state.update(s => ({ ...s, isOpen: true }));
    },

    close() {
      state.update(s => ({ ...s, isOpen: false }));
    },

    setTheme(theme: string) {
      localStorage.setItem('app_theme', theme);
      state.update(s => ({ ...s, currentTheme: theme }));
      document.documentElement.setAttribute('data-theme', theme);
    }
  };
}

export const themeLogic = {
  availableThemes: [
    { id: 'default', name: 'Default Dark', preview: '#1a1a1a' },
    { id: 'light', name: 'Light Mode', preview: '#ffffff' },
    { id: 'medieval', name: 'Medieval', preview: '#8b4513' },
    { id: 'cyberpunk', name: 'Cyberpunk', preview: '#0d1117' },
    { id: 'nature', name: 'Forest', preview: '#2d5016' }
  ],

  applyTheme(themeId: string) {
    const root = document.documentElement;
    
    switch (themeId) {
      case 'light':
        root.style.setProperty('--color-content-main', '#ffffff');
        root.style.setProperty('--color-content-dark', '#f5f5f5');
        root.style.setProperty('--color-primary-text', '#333333');
        break;
      case 'medieval':
        root.style.setProperty('--color-content-main', '#8b4513');
        root.style.setProperty('--color-content-dark', '#654321');
        root.style.setProperty('--color-primary-text', '#f4f1e8');
        break;
      case 'cyberpunk':
        root.style.setProperty('--color-content-main', '#0d1117');
        root.style.setProperty('--color-content-dark', '#010409');
        root.style.setProperty('--color-primary-text', '#00ff00');
        break;
      case 'nature':
        root.style.setProperty('--color-content-main', '#2d5016');
        root.style.setProperty('--color-content-dark', '#1a2e0a');
        root.style.setProperty('--color-primary-text', '#90ee90');
        break;
      default:
        // Reset to default theme
        root.style.removeProperty('--color-content-main');
        root.style.removeProperty('--color-content-dark');
        root.style.removeProperty('--color-primary-text');
        break;
    }
  },

  getCurrentTheme(): string {
    return localStorage.getItem('app_theme') || 'default';
  }
};