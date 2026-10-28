"use server";

import { cookies } from "next/headers";
import { createAuthActions, setAuthCookies, clearAuthCookies } from "@insforge/sdk/ssr";

const insforgeUrl =
  process.env.NEXT_PUBLIC_INSFORGE_URL || "https://pprn26i7.us-east.insforge.app";
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || "";

export async function initiateOAuthAction(
  provider: "google" | "github",
  redirectTo?: string
): Promise<{ url?: string; error?: string }> {
  try {
    const cookieStore = await cookies();
    const auth = createAuthActions({
      baseUrl: insforgeUrl,
      anonKey: insforgeAnonKey || undefined,
      cookies: cookieStore,
    });

    const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const callbackUrl = new URL("/callback", host);
    if (redirectTo) {
      callbackUrl.searchParams.set("redirectTo", redirectTo);
    }

    const { data, error } = await auth.signInWithOAuth(provider, {
      redirectTo: callbackUrl.toString(),
      skipBrowserRedirect: true,
    });

    if (error || !data?.url) {
      return { error: error?.message || "Failed to initialize OAuth session." };
    }

    if (data.codeVerifier) {
      cookieStore.set("insforge_code_verifier", data.codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600,
      });
    }

    return { url: data.url };
  } catch (err) {
    console.error("Failed to initiate OAuth:", err);
    return { error: (err as Error).message || "Internal auth initialization error." };
  }
}

export async function exchangeOAuthCodeAction(
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const verifier = cookieStore.get("insforge_code_verifier")?.value || "";

    const auth = createAuthActions({
      baseUrl: insforgeUrl,
      anonKey: insforgeAnonKey || undefined,
      cookies: cookieStore,
    });

    const { error } = await auth.exchangeOAuthCode(code, verifier);
    if (error) {
      return { success: false, error: error.message };
    }

    cookieStore.delete("insforge_code_verifier");
    return { success: true };
  } catch (err) {
    console.error("Failed to exchange OAuth code:", err);
    return { success: false, error: (err as Error).message || "Code exchange failed." };
  }
}

export async function setSessionCookiesAction(tokens: {
  accessToken: string;
  refreshToken?: string | null;
}): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    setAuthCookies(cookieStore, tokens);
    return { success: true };
  } catch (error) {
    console.error("Failed to set session cookies:", error);
    return { success: false };
  }
}

export async function clearSessionCookiesAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    clearAuthCookies(cookieStore);
    return { success: true };
  } catch (error) {
    console.error("Failed to clear session cookies:", error);
    return { success: false };
  }
}
