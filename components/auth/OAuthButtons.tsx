"use client";

import React, { useState, useCallback } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";
import { initiateOAuthAction } from "@/actions/auth";
import { insforge } from "@/lib/insforge-client";

type Props = {
  redirectTo?: string;
};

export function OAuthButtons({ redirectTo }: Props) {
  // 1. State & hooks
  const [activeProvider, setActiveProvider] = useState<"google" | "github" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2. Handlers
  const handleOAuthSignIn = useCallback(
    async (provider: "google" | "github") => {
      setActiveProvider(provider);
      setErrorMessage(null);

      try {
        const result = await initiateOAuthAction(provider, redirectTo);
        if (result.url) {
          window.location.href = result.url;
          return;
        }

        const origin = window.location.origin;
        const callbackUrl = `${origin}/callback${
          redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""
        }`;

        const { error } = await insforge.auth.signInWithOAuth(provider, {
          redirectTo: callbackUrl,
        });

        if (error) {
          setErrorMessage(error.message || `Failed to initialize ${provider} authentication.`);
          setActiveProvider(null);
        }
      } catch (err) {
        console.error(`OAuth error with ${provider}:`, err);
        setErrorMessage("An unexpected network error occurred. Please check your connection.");
        setActiveProvider(null);
      }
    },
    [redirectTo]
  );

  // 3. JSX return
  return (
    <div className="w-full flex flex-col gap-3">
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs font-mono">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Google OAuth Button */}
      <button
        type="button"
        disabled={activeProvider !== null}
        onClick={() => void handleOAuthSignIn("google")}
        className="w-full h-11 px-4 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-sm font-medium flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
      >
        {activeProvider === "google" ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>
          {activeProvider === "google"
            ? "Connecting to Google..."
            : "Continue with Google"}
        </span>
      </button>

      {/* GitHub OAuth Button */}
      <button
        type="button"
        disabled={activeProvider !== null}
        onClick={() => void handleOAuthSignIn("github")}
        className="w-full h-11 px-4 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-sm font-medium flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
      >
        {activeProvider === "github" ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
        )}
        <span>
          {activeProvider === "github"
            ? "Connecting to GitHub..."
            : "Continue with GitHub"}
        </span>
      </button>
    </div>
  );
}
