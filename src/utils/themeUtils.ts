export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'janenecar_theme_mode';

/**
 * Récupère le thème actuellement configuré ou par défaut selon les préférences du système.
 */
export function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';

  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    // Si aucun choix explicite n'est enregistré, détecter la préférence système
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (e) {
    console.warn('Impossible de lire le thème depuis localStorage:', e);
  }

  return 'light';
}

/**
 * Applique le thème à l'élément racine HTML et met à jour le stockage local.
 */
export function applyTheme(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.warn('Impossible de sauvegarder le thème dans localStorage:', e);
  }
}
