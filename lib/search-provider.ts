import { searchTavily } from "./tavily";
import { searchExa } from "./exa";
import type { CleanSearchResult, TavilySearchOptions } from "@/types/tavily";

export type SearchProviderType = "tavily" | "exa";

export interface SearchProviderInfo {
  id: SearchProviderType;
  name: string;
  isAvailable: boolean;
}

/**
 * Returns available search providers based on environment variables.
 */
export function getAvailableSearchProviders(): SearchProviderInfo[] {
  const tavilyKey = process.env.TAVILY_API_KEY;
  const exaKey = process.env.EXA_API_KEY;

  return [
    {
      id: "tavily",
      name: "Tavily Search",
      isAvailable: Boolean(tavilyKey && tavilyKey.trim().length > 0),
    },
    {
      id: "exa",
      name: "Exa Neural Search",
      isAvailable: Boolean(exaKey && exaKey.trim().length > 0),
    },
  ];
}

/**
 * Dispatches a web search with automatic fallback between Tavily and Exa.
 * Tries the primary provider first, and fails over immediately if quota or network errors occur.
 */
export async function searchWeb(
  query: string,
  options?: TavilySearchOptions & { preferredProvider?: SearchProviderType },
): Promise<{ results: CleanSearchResult[]; providerUsed: SearchProviderType | "none" }> {
  const cleanQuery = query?.trim();
  if (!cleanQuery) {
    return { results: [], providerUsed: "none" };
  }

  const providers = getAvailableSearchProviders();
  const available = providers.filter((p) => p.isAvailable);

  if (available.length === 0) {
    console.warn("[Search Provider] Neither TAVILY_API_KEY nor EXA_API_KEY found in environment.");
    return { results: [], providerUsed: "none" };
  }

  // Determine provider order: preferred first if available, otherwise Tavily followed by Exa
  const preferred = options?.preferredProvider;
  const availableIds = available.map((p) => p.id);
  const order: SearchProviderType[] = preferred && availableIds.includes(preferred)
    ? [preferred, ...availableIds.filter((id) => id !== preferred)]
    : (["tavily", "exa"] as const).filter((id) => availableIds.includes(id));

  for (const providerId of order) {
    try {
      let results: CleanSearchResult[] = [];
      if (providerId === "tavily") {
        results = await searchTavily(cleanQuery, options);
      } else if (providerId === "exa") {
        results = await searchExa(cleanQuery, options);
      }

      if (results.length > 0) {
        return { results, providerUsed: providerId };
      }

      console.warn(`[Search Provider] Provider '${providerId}' yielded 0 results for "${cleanQuery}". Trying next provider in chain.`);
    } catch (err: unknown) {
      console.warn(
        `[Search Provider] Provider '${providerId}' search failed for "${cleanQuery}": ${String(err)}. Failing over...`,
      );
    }
  }

  return { results: [], providerUsed: "none" };
}
