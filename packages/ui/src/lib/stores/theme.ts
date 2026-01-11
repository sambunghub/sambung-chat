import { writable, get } from 'svelte/store';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  appliedTheme: 'light' | 'dark';
}

function createThemeStore() {
  const storedTheme = (browser && localStorage.getItem('theme')) as Theme | null;
  const prefersDark = browser && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const initialTheme: ThemeState = {
    theme: storedTheme ?? 'system',
    appliedTheme: (storedTheme === 'system' ? prefersDark : storedTheme === 'dark')
      ? 'dark'
      : 'light',
  };

  const { subscribe, set } = writable<ThemeState>(initialTheme);

  return {
    subscribe,
    setTheme: (theme: Theme) => {
      const appliedTheme = resolveTheme(theme);
      const newState: ThemeState = { theme, appliedTheme };

      set(newState);

      if (browser) {
        localStorage.setItem('theme', theme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(appliedTheme);
      }
    },
    toggleTheme: () => {
      const currentState = get(themeStore);
      const newTheme: Theme = currentState.appliedTheme === 'light' ? 'dark' : 'light';
      themeStore.setTheme(newTheme);
    },
  };
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

const browser = typeof window !== 'undefined';

export const themeStore = createThemeStore();

// Initialize theme on load
if (browser) {
  const storedTheme = localStorage.getItem('theme') as Theme | null;
  const initialTheme = storedTheme ?? 'system';
  const appliedTheme = resolveTheme(initialTheme);

  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(appliedTheme);
}
