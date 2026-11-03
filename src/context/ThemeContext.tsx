import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode } from '../types/timetable';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  activeTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'timetable_theme_mode_v2';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved && ['dark', 'light', 'system'].includes(saved)) {
        return saved as ThemeMode;
      }
    } catch (e) {
      console.error('Failed to load theme mode', e);
    }
    return 'light';
  });

  const [activeTheme, setActiveTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);

    let effectiveTheme: 'dark' | 'light' = 'light';
    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = systemDark ? 'dark' : 'light';
    } else {
      effectiveTheme = theme;
    }

    setActiveTheme(effectiveTheme);
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    if (effectiveTheme === 'light') {
      document.documentElement.classList.add('light-theme', 'light');
      document.documentElement.classList.remove('dark-theme', 'dark');
    } else {
      document.documentElement.classList.add('dark-theme', 'dark');
      document.documentElement.classList.remove('light-theme', 'light');
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effectiveTheme === 'light' ? '#F7F7F4' : '#141513');
    }
  }, [theme]);

  const setTheme = React.useCallback((mode: ThemeMode) => {
    setThemeState(mode);
  }, []);

  const contextValue = React.useMemo(() => ({
    theme,
    setTheme,
    activeTheme,
  }), [theme, setTheme, activeTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
