import type { CleanSearchResult } from "@/types/tavily";
import type { RabbitHoleLead, CandidateEntity } from "@/types/reader";

/**
 * Deterministic Date Extractor
 * Identifies years, decades, month-year, and ISO date expressions in text without LLM calls.
 */
export function extractDatesFromText(text: string): string[] {
  if (!text) return [];

  const foundDates: string[] = [];

  // 1. Full written dates: "October 24, 2024" or "March 2021"
  const fullDateRegex =
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2},?\s+)?(19\d\d|20\d\d)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = fullDateRegex.exec(text)) !== null) {
    foundDates.push(match[0].trim());
  }

  // 2. ISO dates: "2024-03-15"
  const isoRegex = /\b(19\d\d|20\d\d)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g;
  while ((match = isoRegex.exec(text)) !== null) {
    foundDates.push(match[0].trim());
  }

  // 3. Standalone years: "1995", "2008", "2024" (avoid matching numbers in models/specs)
  const yearRegex = /\b(18\d\d|19\d\d|20[0-3]\d)\b/g;
  while ((match = yearRegex.exec(text)) !== null) {
    const yearStr = match[0];
    if (!foundDates.some((d) => d.includes(yearStr))) {
      foundDates.push(yearStr);
    }
  }

  return Array.from(new Set(foundDates));
}

/**
 * Extracts a representative verbatim quote from a snippet around an entity or claim.
 */
export function extractVerbatimQuote(snippet: string, focusKeyword?: string): string {
  if (!snippet) return "";
  const cleaned = snippet.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 250) {
    return cleaned;
  }

  if (focusKeyword && focusKeyword.trim().length > 0) {
    const lower = cleaned.toLowerCase();
    const idx = lower.indexOf(focusKeyword.toLowerCase());
    if (idx !== -1) {
      const start = Math.max(0, cleaned.lastIndexOf(".", idx) + 1);
      const endCandidate = cleaned.indexOf(".", idx + focusKeyword.length);
      const end = endCandidate !== -1 ? endCandidate + 1 : Math.min(cleaned.length, start + 300);
      const excerpt = cleaned.slice(start, end).trim();
      if (excerpt.length >= 20) {
        return excerpt.length <= 300 ? excerpt : `${excerpt.slice(0, 297)}…`;
      }
    }
  }

  // Default to first sentence or first 250 characters
  const firstPeriod = cleaned.indexOf(".");
  if (firstPeriod > 20 && firstPeriod < 250) {
    return cleaned.slice(0, firstPeriod + 1).trim();
  }

  return `${cleaned.slice(0, 247).trim()}…`;
}

/**
 * Identifies and scores candidate rabbit hole leads from search results.
 * Satisfies AC-5: Search score between 0.35 and 0.69 with keyword or temporal divergence.
 */
export function identifyRabbitHoleLeads(
  searchResults: CleanSearchResult[],
  existingGraphKeywords: string[] = [],
  mainQueryAnchor = "",
): RabbitHoleLead[] {
  const leads: RabbitHoleLead[] = [];
  const cleanKeywords = existingGraphKeywords
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length >= 3);

  for (const item of searchResults) {
    if (item.score < 0.35 || item.score > 0.69) {
      continue;
    }

    const textToMatch = `${item.title} ${item.content}`.toLowerCase();
    const matchedKeywords: string[] = [];

    for (const kw of cleanKeywords) {
      if (textToMatch.includes(kw)) {
        matchedKeywords.push(kw);
      }
    }

    // Fallback: If no existing graph keywords, check for historical marker divergence
    let isQualified = matchedKeywords.length > 0;
    let divergentTopic = `Alternative pathway related to ${item.title}`;

    if (!isQualified && cleanKeywords.length === 0) {
      const dates = extractDatesFromText(item.content);
      const hasDivergentDate = dates.length > 0 && (!mainQueryAnchor || !dates.includes(mainQueryAnchor));
      const hasHistoricalMarker =
        textToMatch.includes("founding") ||
        textToMatch.includes("patent") ||
        textToMatch.includes("predecessor") ||
        textToMatch.includes("origin") ||
        textToMatch.includes("transition");

      if (hasDivergentDate || hasHistoricalMarker) {
        isQualified = true;
        divergentTopic = `Divergent historical lead: ${item.title.slice(0, 80)}`;
      }
    }

    if (isQualified) {
      leads.push({
        title: item.title,
        url: item.url,
        domain: item.domain,
        divergentTopic,
        matchedContextKeywords: matchedKeywords,
        searchScore: item.score,
        snippet: item.content.slice(0, 1500),
      });
    }

    if (leads.length >= 3) {
      break;
    }
  }

  return leads;
}

/**
 * Normalizes an entity name by trimming, lowercasing, and stripping corporate suffixes.
 */
export function normalizeEntityName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\b(ltd|limited|inc|incorporated|corp|corporation|co|company|llc|plc|gmbh|sa)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deduplicates candidate entities across multiple sub-queries.
 * Combines source URLs and preserves highest-detail significance description.
 */
export function deduplicateCandidateEntities(entities: CandidateEntity[]): CandidateEntity[] {
  const map = new Map<string, CandidateEntity>();

  for (const ent of entities) {
    const key = normalizeEntityName(ent.name);
    if (!key) continue;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, ent);
    } else {
      // Keep longer significance or more specific temporal anchor
      const longerSignificance =
        ent.significance.length > existing.significance.length ? ent.significance : existing.significance;
      const bestAnchor = existing.temporalAnchor || ent.temporalAnchor;

      map.set(key, {
        ...existing,
        significance: longerSignificance,
        temporalAnchor: bestAnchor,
      });
    }
  }

  return Array.from(map.values());
}
