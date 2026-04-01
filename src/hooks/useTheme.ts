import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'orbita-theme';
const EXPLICIT_STORAGE_KEY = 'orbita-theme-explicit';

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

function persistTheme(theme: Theme, isExplicit = false) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEY, theme);

  if (isExplicit) {
    localStorage.setItem(EXPLICIT_STORAGE_KEY, 'true');
  } else if (localStorage.getItem(EXPLICIT_STORAGE_KEY) === null) {
    localStorage.setItem(EXPLICIT_STORAGE_KEY, 'false');
  }
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  const hasExplicitPreference = localStorage.getItem(EXPLICIT_STORAGE_KEY) === 'true';

  if (hasExplicitPreference && stored === 'dark') {
    return 'dark';
  }

  persistTheme('light');
  return 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);

    const hasExplicitPreference =
      typeof window !== 'undefined' && localStorage.getItem(EXPLICIT_STORAGE_KEY) === 'true';

    persistTheme(theme, hasExplicitPreference);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      persistTheme(nextTheme, true);
      return nextTheme;
    });
  }, []);

  return { theme, toggleTheme };
}
