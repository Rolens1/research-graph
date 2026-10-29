import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";
import type { InsForgeClient } from "@insforge/sdk";

const insforgeUrl =
  process.env.NEXT_PUBLIC_INSFORGE_URL || "https://pprn26i7.us-east.insforge.app";
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || "";

/**
 * Creates an authenticated InsForge client for Server Actions and Server Components.
 * Reads the session cookie asynchronously using Next.js headers.
 */
export async function getInsForgeServerClient(): Promise<InsForgeClient> {
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch {
    // Outside request store context (e.g. tests or background jobs)
    cookieStore = {
      get: () => undefined,
    };
  }
  return createServerClient({
    baseUrl: insforgeUrl,
    anonKey: insforgeAnonKey || undefined,
    cookies: cookieStore,
  });
}
