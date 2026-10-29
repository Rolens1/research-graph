import { tavily, type TavilyClient } from "@tavily/core";
import {
  cleanSearchResultSchema,
  type CleanSearchResult,
  type TavilySearchOptions,
} from "@/types/tavily";

/**
 * Cache Configuration
 * Bounded LRU in-memory store to prevent duplicate billable calls during an active investigation session.
 */
const MAX_CACHE_SIZE = 200;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

type CacheEntry = {
  timestamp: number;
  results: CleanSearchResult[];
};

const searchCache = new Map<string, CacheEntry>();

/**
 * Singleton client cache to avoid recreating client instances on every call.
 */
let cachedClient: TavilyClient | null = null;
let lastApiKey: string | undefined = undefined;

function getTavilyClient(): TavilyClient | null {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }

  if (cachedClient && lastApiKey === apiKey) {
    return cachedClient;
  }

  try {
    cachedClient = tavily({ apiKey: apiKey.trim() });
    lastApiKey = apiKey;
    return cachedClient;
  } catch (error) {
    console.warn(`[Tavily] Failed to initialize client: ${String(error)}`);
    return null;
  }
}

/**
 * Strips HTML tags, collapses whitespace, and clamps content length.
 */
function sanitizeSnippet(rawContent: string, maxLength = 1500): string {
  if (!rawContent) return "";
  const noHtml = rawContent.replace(/<[^>]*>/g, " ");
  const normalized = noHtml.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

/**
 * Safely extracts clean publisher domain from URL.
 */
function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "unknown";
  }
}

/**
 * Evaluates whether a search snippet relates to active graph context keywords.
 */
function matchesContextKeywords(text: string, contextKeywords: string[]): boolean {
  if (!contextKeywords || contextKeywords.length === 0) return false;
  const lowerText = text.toLowerCase();
  return contextKeywords.some((term) => {
    const cleanTerm = term.trim().toLowerCase();
    return cleanTerm.length >= 3 && lowerText.includes(cleanTerm);
  });
}

/**
 * Generates deterministic cache key.
 */
function buildCacheKey(query: string, depth: string, context?: string[]): string {
  const sortedContext = context ? [...context].sort().join("|") : "";
  return `${depth}:${query.trim().toLowerCase()}:${sortedContext}`;
}

/**
 * Primary Server Search Execution Function
 * Grounded in Spec 0018: Dual mode search, score filtering, rabbit hole lead retention,
 * 8-second timeout, LRU cache, and silent fallback.
 */
export async function searchTavily(
  query: string,
  options?: TavilySearchOptions,
): Promise<CleanSearchResult[]> {
  const cleanQuery = query?.trim();
  if (!cleanQuery) {
    return [];
  }

  const depth = options?.depth ?? "basic";
  const maxResults = options?.maxResults ?? 4;
  const includeRawContent = options?.includeRawContent ?? false;
  const relatedNodeContext = options?.relatedNodeContext ?? [];

  // 1. Secret & Client Verification
  const client = getTavilyClient();
  if (!client) {
    console.warn(
      `[Tavily] Missing TAVILY_API_KEY in environment variables; search returning safe empty results fallback.`,
    );
    return [];
  }

  // 2. Cache Lookup
  const cacheKey = buildCacheKey(cleanQuery, depth, relatedNodeContext);
  const cached = searchCache.get(cacheKey);
  if (cached) {
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      // Re-insert to refresh LRU order
      searchCache.delete(cacheKey);
      searchCache.set(cacheKey, cached);
      return cached.results;
    }
    searchCache.delete(cacheKey);
  }

  // 3. Merged Signal with 8-Second Deadline
  const timeoutMs = 8000;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  let effectiveSignal: AbortSignal = timeoutSignal;

  if (options?.signal) {
    if (typeof AbortSignal.any === "function") {
      effectiveSignal = AbortSignal.any([timeoutSignal, options.signal]);
    } else {
      const controller = new AbortController();
      const abort = () => controller.abort();
      timeoutSignal.addEventListener("abort", abort, { once: true });
      options.signal.addEventListener("abort", abort, { once: true });
      effectiveSignal = controller.signal;
    }
  }

  if (effectiveSignal.aborted) {
    console.warn(`[Tavily] Search aborted prior to execution for query: "${cleanQuery}"`);
    return [];
  }

  try {
    // 4. Remote Tavily Search Call
    const rawResponse = await client.search(cleanQuery, {
      searchDepth: depth,
      maxResults,
      includeRawContent: includeRawContent ? "markdown" : false,
      timeout: timeoutMs,
    });

    if (!rawResponse || !Array.isArray(rawResponse.results)) {
      return [];
    }

    // 5. Post-Processing, Score Cutoffs & Rabbit Hole Lead Retention
    const processedResults: CleanSearchResult[] = [];

    for (const item of rawResponse.results) {
      if (!item || !item.url || !item.title) continue;

      const rawSnippet = item.content || item.rawContent || "";
      const cleanedContent = sanitizeSnippet(rawSnippet);
      const domain = extractDomain(item.url);
      const score = typeof item.score === "number" ? Math.max(0, Math.min(1, item.score)) : 0.5;

      let accepted = false;
      let isRabbitHoleLead = false;

      if (depth === "basic") {
        // Basic mode: strict signal requirement
        const threshold = options?.minScore ?? 0.7;
        accepted = score >= threshold;
      } else {
        // Advanced mode: deep exploration with rabbit hole lead retention
        const standardThreshold = options?.minScore ?? 0.4;
        if (score >= standardThreshold) {
          accepted = true;
        } else if (score >= 0.35 && relatedNodeContext.length > 0) {
          // Check if snippet matches active node context
          const matchesContext = matchesContextKeywords(
            `${item.title} ${cleanedContent}`,
            relatedNodeContext,
          );
          if (matchesContext) {
            accepted = true;
            isRabbitHoleLead = true;
          }
        }
      }

      if (!accepted) continue;

      const candidate = {
        title: item.title.trim(),
        url: item.url.trim(),
        domain,
        content: cleanedContent,
        score,
        publishedDate: item.publishedDate ? item.publishedDate.trim() : undefined,
        isRabbitHoleLead: isRabbitHoleLead || undefined,
      };

      const parseResult = cleanSearchResultSchema.safeParse(candidate);
      if (parseResult.success) {
        processedResults.push(parseResult.data);
      }
    }

    // 6. LRU Cache Storage
    if (searchCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = searchCache.keys().next().value;
      if (oldestKey) {
        searchCache.delete(oldestKey);
      }
    }
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      results: processedResults,
    });

    return processedResults;
  } catch (error: unknown) {
    // 7. Resilient Fallbacks
    const err = error as { name?: string; status?: number; message?: string };

    if (err?.name === "AbortError" || err?.name === "TimeoutError" || effectiveSignal.aborted) {
      console.warn(`[Tavily] Search timed out or was aborted for query: "${cleanQuery}"`);
      return [];
    }

    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota")) {
      console.warn(`[Tavily] Rate limit or credit quota exhausted: ${String(error)}`);
      return [];
    }

    console.warn(`[Tavily] Search execution failed for query "${cleanQuery}": ${String(error)}`);
    return [];
  }
}

/**
 * Clears the in-memory Tavily search cache. Useful for test suites and memory purges.
 */
export function clearTavilyCache(): void {
  searchCache.clear();
}

/**
 * Returns the current size of the Tavily search cache.
 */
export function getTavilyCacheSize(): number {
  return searchCache.size;
}
