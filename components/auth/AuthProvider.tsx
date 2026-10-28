"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { insforge } from "@/lib/insforge-client";
import { clearSessionCookiesAction } from "@/actions/auth";

export interface AuthUser {
  id: string;
  email: string;
  emailVerified?: boolean;
  providers?: string[];
  createdAt?: string;
  updatedAt?: string;
  profile?: {
    name?: string | null;
    avatar_url?: string | null;
    [key: string]: unknown;
  };
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  // 1. State and hooks
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // 2. Handlers
  const handleSignOut = useCallback(async () => {
    try {
      await insforge.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      await clearSessionCookiesAction();
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data, error } = await insforge.auth.getCurrentUser();
        if (!error && data?.user && isMounted) {
          setUser(data.user as AuthUser);
        }
      } catch (err) {
        console.error("Failed to load current user:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void initAuth();

    const unsubscribe = insforge.auth.onAuthStateChange(
      (event) => {
        if (!isMounted) return;

        if (event === "signedIn" || event === "tokenRefreshed") {
          void insforge.auth.getCurrentUser().then(({ data }) => {
            if (data?.user && isMounted) {
              setUser(data.user as AuthUser);
            }
          });
        } else if (event === "signedOut") {
          setUser(null);
          void clearSessionCookiesAction();
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // 3. Derived values & memoized computations
  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      signOut: handleSignOut,
    }),
    [user, isLoading, handleSignOut]
  );

  // 4. JSX return
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
