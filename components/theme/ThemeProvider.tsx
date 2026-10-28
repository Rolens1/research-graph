"use client";

// 1. External imports
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

// 2. Internal imports
import { updateUserThemeAction, getUserThemeAction, type Theme } from "@/actions/theme";
import { useAuth } from "@/components/auth/AuthProvider";

// 3. Type definitions
export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "chronocause_theme";

type Props = {
  children: React.ReactNode;
};

// 4. Component
export function ThemeProvider({ children }: Props) {
  // 1. State & hooks
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached === "dark" || cached === "light") {
          return cached;
        }
      } catch {
        // Fallback to light
      }
    }
    return "light";
  });
  const { user } = useAuth();

  // Helper to apply class to root HTML element
  const applyThemeToDOM = useCallback((newTheme: Theme) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (newTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, []);

  // Set theme with localStorage and background server synchronization
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      applyThemeToDOM(newTheme);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, newTheme);
        } catch {
          // Ignore localStorage errors in private mode
        }
      }

      // Sync to database if authenticated
      if (user) {
        void updateUserThemeAction(newTheme);
      }
    },
    [applyThemeToDOM, user]
  );

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [theme, setTheme]);

  // Sync DOM on mount and reconcile with cloud profile in background if user is authenticated
  useEffect(() => {
    applyThemeToDOM(theme);

    if (user) {
      let isMounted = true;
      void getUserThemeAction().then((res) => {
        if (isMounted && res.theme && res.theme !== theme) {
          setThemeState(res.theme);
          applyThemeToDOM(res.theme);
          try {
            localStorage.setItem(STORAGE_KEY, res.theme);
          } catch {
            // Ignore
          }
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [user, theme, applyThemeToDOM]);

  // 2. Derived values & memoized computations
  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
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
