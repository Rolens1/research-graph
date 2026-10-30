"use client";

// 1. External imports
import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";

// 2. Internal imports
import { updateUserThemeAction, getUserThemeAction, type Theme } from "@/actions/theme";
import { useAuth } from "@/components/auth/AuthProvider";

// 3. Type definitions
export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "chronocause_theme";
const THEME_CHANGE_EVENT = "chronocause_theme_change";

function applyThemeToDOM(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
}

function subscribeToTheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

function getThemeSnapshot(): Theme {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached === "dark" || cached === "light") {
      return cached;
    }
  } catch {
    // Ignore
  }
  return "light";
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

const emptySubscribe = () => () => {};

type Props = {
  children: React.ReactNode;
};

// 4. Component
export function ThemeProvider({ children }: Props) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const { user } = useAuth();

  const setTheme = useCallback(
    (newTheme: Theme) => {
      applyThemeToDOM(newTheme);
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch {
        // Ignore storage write error
      }
      window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
      if (user) {
        void updateUserThemeAction(newTheme);
      }
    },
    [user]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // Sync DOM with theme and reconcile with cloud profile in background if user is authenticated
  useEffect(() => {
    applyThemeToDOM(theme);

    if (user) {
      let isMounted = true;
      void getUserThemeAction().then((res) => {
        if (isMounted && res.theme && res.theme !== theme) {
          applyThemeToDOM(res.theme);
          try {
            localStorage.setItem(STORAGE_KEY, res.theme);
          } catch {
            // Ignore
          }
          window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [user, theme]);

  // 2. Derived values & memoized computations
  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      mounted,
    }),
    [theme, setTheme, toggleTheme, mounted]
  );

  // 3. JSX return
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
