'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ThemeMode = 'light' | 'dark';

/**
 * State and actions exposed by the workspace ThemeContext.
 */
export interface ThemeContextValue {
  readonly theme: ThemeMode;
  readonly toggleTheme: () => void;
  readonly setTheme: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = 'cn_workspace_theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  readonly children: React.ReactNode;
}

/**
 * Synchronizes the active theme class and color-scheme on the root HTML element.
 *
 * @param mode - Active theme mode ('light' or 'dark').
 */
function syncDocumentTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  root.style.colorScheme = mode;
}

/**
 * Provides Light / Dark theme state and persistence across the application.
 * Applies the `dark` class both to `document.documentElement` and a declarative wrapper
 * so Next.js App Router transitions never lose active dark-mode styles.
 *
 * @param props - Child React tree.
 * @returns ThemeContext.Provider element.
 */
export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    let initialMode: ThemeMode = 'light';
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        initialMode = saved;
      } else if (
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        initialMode = 'dark';
      }
    } catch {
      initialMode = 'light';
    }

    setThemeState(initialMode);
    syncDocumentTheme(initialMode);
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    syncDocumentTheme(theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage write errors in restricted browsing modes
    }
  }, [theme, hasHydrated]);

  /**
   * Sets a specific theme mode ('light' or 'dark').
   *
   * @param mode - Target ThemeMode.
   */
  const setTheme = useCallback((mode: ThemeMode): void => {
    syncDocumentTheme(mode);
    setThemeState(mode);
  }, []);

  /**
   * Toggles between light and dark theme modes.
   */
  const toggleTheme = useCallback((): void => {
    setThemeState((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      syncDocumentTheme(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <div
        data-theme={theme}
        className={
          theme === 'dark'
            ? 'dark min-h-screen bg-zinc-950 text-zinc-100 transition-colors duration-200'
            : 'min-h-screen bg-[#eaedec] text-stone-900 transition-colors duration-200'
        }
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to access and toggle the current theme mode (light/dark).
 *
 * @returns ThemeContextValue containing active theme and toggle handler.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'light',
      toggleTheme: () => undefined,
      setTheme: () => undefined,
    };
  }
  return context;
}
