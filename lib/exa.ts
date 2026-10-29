import Exa from "exa-js";
import {
  cleanSearchResultSchema,
  type CleanSearchResult,
  type TavilySearchOptions,
} from "@/types/tavily";

/**
 * Cache Configuration
 * Bounded LRU in-memory store to prevent duplicate billable calls during an active investigation.
 */
const MAX_CACHE_SIZE = 200;
const CACHE_TTL_MS = 10 * 60 * 1000;

type CacheEntry = {
  timestamp: number;
  results: CleanSearchResult[];
};

const searchCache = new Map<string, CacheEntry>();

let cachedClient: Exa | null = null;
let lastApiKey: string | undefined = undefined;

function getExaClient(): Exa | null {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }

  if (cachedClient && lastApiKey === apiKey) {
    return cachedClient;
  }

  try {
    cachedClient = new Exa(apiKey.trim());
    lastApiKey = apiKey;
    return cachedClient;
  } catch (error) {
    console.warn(`[Exa] Failed to initialize client: ${String(error)}`);
    return null;
  }
}

function sanitizeSnippet(rawContent: string, maxLength = 1500): string {
  if (!rawContent) return "";
  const noHtml = rawContent.replace(/<[^>]*>/g, " ");
  const normalized = noHtml.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "unknown";
  }
}

function matchesContextKeywords(text: string, contextKeywords: string[]): boolean {
  if (!contextKeywords || contextKeywords.length === 0) return false;
  const lowerText = text.toLowerCase();
  return contextKeywords.some((term) => {
    const cleanTerm = term.trim().toLowerCase();
    return cleanTerm.length >= 3 && lowerText.includes(cleanTerm);
  });
}

function buildCacheKey(query: string, context?: string[]): string {
  const sortedContext = context ? [...context].sort().join("|") : "";
  return `exa:${query.trim().toLowerCase()}:${sortedContext}`;
}

/**
 * Executes a semantic web search using Exa according to build-with-exa canonical patterns.
 * Requests auto search with token efficient highlights and maps to CleanSearchResult.
 */
export async function searchExa(
  query: string,
  options?: TavilySearchOptions,
): Promise<CleanSearchResult[]> {
  const cleanQuery = query?.trim();
  if (!cleanQuery) {
    return [];
  }

  const maxResults = options?.maxResults ?? 4;
  const relatedNodeContext = options?.relatedNodeContext ?? [];

  const client = getExaClient();
  if (!client) {
    console.warn("[Exa] Missing EXA_API_KEY in environment variables; returning safe empty fallback.");
    return [];
  }

  const cacheKey = buildCacheKey(cleanQuery, relatedNodeContext);
  const cached = searchCache.get(cacheKey);
  if (cached) {
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      searchCache.delete(cacheKey);
      searchCache.set(cacheKey, cached);
      return cached.results;
    }
    searchCache.delete(cacheKey);
  }

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
    console.warn(`[Exa] Search aborted prior to execution for query: "${cleanQuery}"`);
    return [];
  }

  try {
    const response = await client.search(cleanQuery, {
      type: "auto",
      contents: { highlights: true },
      numResults: maxResults,
    });

    if (!response || !Array.isArray(response.results)) {
      return [];
    }

    const processedResults: CleanSearchResult[] = [];

    for (const item of response.results) {
      if (!item || !item.url || !item.title) continue;

      const highlightsText = Array.isArray(item.highlights) && item.highlights.length > 0
        ? item.highlights.join("\n\n")
        : "";
      const rawSnippet = highlightsText || item.title || "";
      const cleanedContent = sanitizeSnippet(rawSnippet);
      const domain = extractDomain(item.url);
      const score = 0.85;

      const isRabbitHole = matchesContextKeywords(cleanedContent, relatedNodeContext);

      const candidate: CleanSearchResult = {
        title: item.title.trim(),
        url: item.url.trim(),
        domain,
        content: cleanedContent.length >= 10 ? cleanedContent : `${item.title.trim()} documented online.`,
        score,
        publishedDate: item.publishedDate || undefined,
        isRabbitHoleLead: isRabbitHole,
      };

      const parseResult = cleanSearchResultSchema.safeParse(candidate);
      if (parseResult.success) {
        processedResults.push(parseResult.data);
      }
    }

    if (searchCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = searchCache.keys().next().value;
      if (oldestKey) searchCache.delete(oldestKey);
    }

    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      results: processedResults,
    });

    return processedResults;
  } catch (error: unknown) {
    const err = error as { name?: string; status?: number; message?: string };
    if (err?.name === "AbortError" || err?.name === "TimeoutError" || effectiveSignal.aborted) {
      console.warn(`[Exa] Search timed out or was aborted for query: "${cleanQuery}"`);
      return [];
    }

    console.warn(`[Exa] Search execution failed for query "${cleanQuery}": ${String(error)}`);
    return [];
  }
}

export function clearExaCache(): void {
  searchCache.clear();
}
