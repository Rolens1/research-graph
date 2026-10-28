import { createClient, InsForgeClient } from "@insforge/sdk";

const insforgeUrl =
  process.env.NEXT_PUBLIC_INSFORGE_URL || "https://pprn26i7.us-east.insforge.app";
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || "";

let clientInstance: InsForgeClient | null = null;

export function getInsForgeClient(): InsForgeClient {
  if (!clientInstance) {
    clientInstance = createClient({
      baseUrl: insforgeUrl,
      anonKey: insforgeAnonKey || undefined,
    });
  }
  return clientInstance;
}

export const insforge = getInsForgeClient();
