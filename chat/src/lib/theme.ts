'use client';

import { useCallback, useEffect, useState } from 'react';

export type AppTheme = 'dark' | 'light' | 'contrast';

const THEME_KEY = 'app-theme';

function isTheme(value: string | null): value is AppTheme {
  return value === 'dark' || value === 'light' || value === 'contrast';
}

function applyTheme(theme: AppTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

export function useTheme(defaultTheme: AppTheme = 'dark') {
  const [theme, setThemeState] = useState<AppTheme>(defaultTheme);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    const initialTheme = isTheme(savedTheme) ? savedTheme : defaultTheme;
    setThemeState(initialTheme);
    applyTheme(initialTheme);
  }, [defaultTheme]);

  const setTheme = useCallback((nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_KEY, nextTheme);
    }
  }, []);

  return { theme, setTheme };
}
