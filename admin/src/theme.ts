export type ThemeMode = 'light' | 'dark' | 'midnight' | 'ocean';

export const THEME_OPTIONS: { id: ThemeMode; label: string; icon: string; description: string }[] = [
  { id: 'light', label: 'Sky', icon: '☁️', description: 'Light blue glass workspace' },
  { id: 'dark', label: 'Dark', icon: '🌙', description: 'Soft charcoal tones' },
  { id: 'midnight', label: 'Midnight', icon: '✦', description: 'Deep navy quantum' },
  { id: 'ocean', label: 'Ocean', icon: '🌊', description: 'Teal coastal vibe' },
];

const STORAGE_KEY = 'qc_admin_theme';

export function getStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'midnight' || stored === 'ocean') {
    return stored;
  }
  return 'light';
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}
