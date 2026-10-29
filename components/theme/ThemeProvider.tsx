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

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      applyThemeToDOM(newTheme);
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch {
        // Ignore storage write error
      }
      if (user) {
        void updateUserThemeAction(newTheme);
      }
    },
    [user]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
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
  }, [user, theme]);

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
