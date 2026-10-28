import { createRefreshAuthRouter } from "@insforge/sdk/ssr";

const insforgeUrl =
  process.env.NEXT_PUBLIC_INSFORGE_URL || "https://pprn26i7.us-east.insforge.app";
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || "";

export const { POST } = createRefreshAuthRouter({
  baseUrl: insforgeUrl,
  anonKey: insforgeAnonKey || undefined,
});
