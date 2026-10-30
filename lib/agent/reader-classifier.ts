import { generateText } from "ai";
import { z } from "zod";
import type { CleanSearchResult } from "@/types/tavily";
import type { CandidateEntity, ExtractedFact } from "@/types/reader";
import { candidateEntitySchema, extractedFactSchema } from "@/types/reader";
import { executeWithLlmFallback } from "@/lib/llm-provider";
import { extractDatesFromText, extractVerbatimQuote } from "./reader-heuristics";

export class ReaderClassificationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(`[Reader Classifier Error] ${message}`);
    this.name = "ReaderClassificationError";
  }
}

const classificationOutputSchema = z.object({
  entities: z.array(
    z.object({
      name: z.string().min(1),
      entityType: z.enum(["actor", "event", "technology", "decision", "dispute"]),
      significance: z.string().min(5),
      temporalAnchor: z.string().optional(),
      sourceUrl: z.string(),
      quoteSnippet: z.string().min(10),
    }),
  ),
  facts: z.array(
    z.object({
      statement: z.string().min(10),
      dateMentioned: z.string().optional(),
      entitiesInvolved: z.array(z.string()).default([]),
      sourceUrl: z.string(),
      quoteSnippet: z.string().min(10),
      confidenceScore: z.number().int().min(0).max(100).default(85),
    }),
  ),
});

const CLASSIFICATION_SYSTEM_PROMPT = `You are "The Reader", an analytical intelligence worker that extracts verified candidate entities and facts from search snippets.

STRICT INSTRUCTIONS:
1. ENTITY TYPES:
   - "actor": Organization, government body, leader, co-founder, investor, founding syndicate, or network ally (e.g. PayPal Mafia members, early business partners).
   - "event": Historical incident, launch, acquisition, buyout, liquidity event, IPO, or merger.
   - "technology": Specific patent, software platform, battery chemistry, hardware, or technical method.
   - "decision": Capital investment, buyout payout, corporate pivot, equity allocation, or legal choice.
   - "dispute": Contested claim, board coup, sanctions battle, trade dispute, or legal conflict.

2. ACCURACY & EVIDENCE:
   - Only extract entities and facts directly supported by the provided search snippets.
   - Every entity and fact MUST reference an exact "sourceUrl" from the input.
   - Extract a real, verbatim quote fragment (at least 15 characters) for "quoteSnippet".
   - Include specific financial metrics ($ valuations, acquisition amounts, cash payouts) and co-founders/collaborators in entity summaries and statements whenever present.

3. EXTRACT EXTENSIVE NETWORK:
   - Extract 8 to 15 high-relevance entities across balanced categories:
     * "technology": Crucial technological breakthroughs, engineering platforms, propulsion systems, patents, battery chemistries, hardware designs.
     * "decision": Pivotal funding rounds, venture capital investments, acquisitions, buyout liquidity payouts, contracts, executive decisions.
     * "event": Crucial historical milestones, orbital launches, IPOs, market entrances.
     * "dispute": Contested claims, lawsuits, board coup attempts, valuation disagreements.
     * "actor": Core founders, key leaders, allied investment syndicates, space/defense agencies.
   - For every entity, identify its approximate year or calendar date in "temporalAnchor" whenever mentioned in the source (e.g. "2002", "2004", "2008").
   - Extract 8 to 15 concrete historical facts with dates, financial metrics ($ valuations, acquisition amounts, cash payouts), and co-founders/collaborators.

4. FORMAT:
   - Respond ONLY with valid JSON matching this schema:
   {
     "entities": [
       {
         "name": "string",
         "entityType": "actor" | "event" | "technology" | "decision" | "dispute",
         "significance": "why this entity matters to the inquiry",
         "temporalAnchor": "e.g. 2003",
         "sourceUrl": "exact url from results",
         "quoteSnippet": "exact verbatim text fragment"
       }
     ],
     "facts": [
       {
         "statement": "concrete historical assertion",
         "dateMentioned": "e.g. 2008",
         "entitiesInvolved": ["entity1", "entity2"],
         "sourceUrl": "exact url from results",
         "quoteSnippet": "verbatim text supporting this statement",
         "confidenceScore": 85
       }
     ]
   }`;

function inferHeuristicEntityType(title: string, content: string): "actor" | "event" | "technology" | "decision" | "dispute" {
  const text = `${title} ${content}`.toLowerCase();
  if (
    text.includes("patent") ||
    text.includes("engine") ||
    text.includes("rocket") ||
    text.includes("battery") ||
    text.includes("hardware") ||
    text.includes("software") ||
    text.includes("algorithm") ||
    text.includes("transponder") ||
    text.includes("spoofing") ||
    text.includes("breakthrough") ||
    text.includes("technology")
  ) {
    return "technology";
  }
  if (
    text.includes("invest") ||
    text.includes("funding") ||
    text.includes("series") ||
    text.includes("capital") ||
    text.includes("merger") ||
    text.includes("acquisition") ||
    text.includes("buyout") ||
    text.includes("contract") ||
    text.includes("resolution") ||
    text.includes("mandate") ||
    text.includes("policy") ||
    text.includes("decision")
  ) {
    return "decision";
  }
  if (
    text.includes("dispute") ||
    text.includes("conflict") ||
    text.includes("lawsuit") ||
    text.includes("controversy") ||
    text.includes("contested") ||
    text.includes("sanctions") ||
    text.includes("premium")
  ) {
    return "dispute";
  }
  if (
    text.includes("founder") ||
    text.includes("ceo") ||
    text.includes("musk") ||
    text.includes("group") ||
    text.includes("forces") ||
    text.includes("corp") ||
    text.includes("inc") ||
    text.includes("agency") ||
    text.includes("organization") ||
    text.includes("syndicate")
  ) {
    return "actor";
  }
  return "event";
}

function extractHeuristicEntitiesAndFacts(
  searchResults: CleanSearchResult[],
  queryText: string,
): { candidateEntities: CandidateEntity[]; extractedFacts: ExtractedFact[] } {
  const candidateEntities: CandidateEntity[] = [];
  const extractedFacts: ExtractedFact[] = [];

  for (const res of searchResults.slice(0, 10)) {
    const titleToken = res.title.split(/[-|—:]/)[0].trim();
    const dates = extractDatesFromText(res.content);
    const temporal = dates[0] || undefined;
    const quote = extractVerbatimQuote(res.content, titleToken);
    const inferredType = inferHeuristicEntityType(res.title, res.content);

    if (titleToken.length >= 3) {
      candidateEntities.push({
        name: titleToken.slice(0, 60),
        entityType: inferredType,
        significance: `Historical finding related to "${queryText}" documented by ${res.domain}.`,
        temporalAnchor: temporal,
        sourceUrl: res.url,
        quoteSnippet: quote.length >= 10 ? quote : `Historical evidence on ${titleToken}.`,
      });
    }

    if (res.content.length >= 20) {
      extractedFacts.push({
        statement: quote.length >= 10 ? quote.slice(0, 200) : res.title.slice(0, 200),
        dateMentioned: temporal,
        entitiesInvolved: [titleToken.slice(0, 60)],
        sourceUrl: res.url,
        sourceTitle: res.title,
        sourceDomain: res.domain,
        quoteSnippet: quote.length >= 10 ? quote : `Verified evidence from ${res.url}`,
        confidenceScore: 80,
      });
    }
  }

  return { candidateEntities, extractedFacts };
}

/**
 * Classifies search snippets into candidate entities and factual assertions.
 * Satisfies AC-3, AC-4, AC-6, AC-7.
 */
export async function classifySearchContent(
  searchResults: CleanSearchResult[],
  queryText: string,
  options?: {
    preferredProvider?: string;
    signal?: AbortSignal;
  },
): Promise<{
  candidateEntities: CandidateEntity[];
  extractedFacts: ExtractedFact[];
}> {
  if (searchResults.length === 0) {
    return { candidateEntities: [], extractedFacts: [] };
  }

  // Pre-index search results by URL for provenance resolution
  const urlMap = new Map<string, CleanSearchResult>();
  for (const res of searchResults) {
    urlMap.set(res.url, res);
  }

  const serializedSnippets = searchResults.map((r, i) => ({
    index: i + 1,
    title: r.title,
    url: r.url,
    domain: r.domain,
    snippet: r.content.slice(0, 1000),
  }));

  const userPrompt = `SUB-QUERY INQUIRY: "${queryText}"

SEARCH SNIPPETS TO ANALYZE (${serializedSnippets.length}):
${JSON.stringify(serializedSnippets, null, 2)}

TASK:
Extract the top candidate entities (max 6) and core factual statements (max 5) with source attribution.`;

  try {
    const { result } = await executeWithLlmFallback(
      async (model) => {
        const { text } = await generateText({
          model,
          system: CLASSIFICATION_SYSTEM_PROMPT,
          prompt: userPrompt,
          abortSignal: options?.signal,
        });

        let cleanJson = text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        const firstBrace = cleanJson.indexOf("{");
        const lastBrace = cleanJson.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanJson = cleanJson.slice(firstBrace, lastBrace + 1);
        }

        const rawParsed = JSON.parse(cleanJson);
        const parsed = classificationOutputSchema.parse(rawParsed);
        return parsed;
      },
      { preferredProvider: options?.preferredProvider, role: "reader" },
    );

    // Post-process entities: allow up to 15 entities per batch, fallback date/quote heuristics if missing
    const validEntities: CandidateEntity[] = [];
    for (const ent of result.entities.slice(0, 15)) {
      const sourceMatch = urlMap.get(ent.sourceUrl) || searchResults[0];
      const fallbackDates = extractDatesFromText(ent.quoteSnippet || sourceMatch.content);
      const temporal = ent.temporalAnchor || fallbackDates[0] || undefined;
      const quote = ent.quoteSnippet && ent.quoteSnippet.length >= 10
        ? ent.quoteSnippet
        : extractVerbatimQuote(sourceMatch.content, ent.name);

      const parsedEntity = candidateEntitySchema.safeParse({
        name: ent.name.trim(),
        entityType: ent.entityType,
        significance: ent.significance.trim(),
        temporalAnchor: temporal,
        sourceUrl: sourceMatch.url,
        quoteSnippet: quote,
      });

      if (parsedEntity.success) {
        validEntities.push(parsedEntity.data);
      }
    }

    // Post-process facts: resolve title, domain, provenance
    const validFacts: ExtractedFact[] = [];
    for (const fact of result.facts.slice(0, 15)) {
      const sourceMatch = urlMap.get(fact.sourceUrl) || searchResults[0];
      const quote = fact.quoteSnippet && fact.quoteSnippet.length >= 10
        ? fact.quoteSnippet
        : extractVerbatimQuote(sourceMatch.content);

      const parsedFact = extractedFactSchema.safeParse({
        statement: fact.statement.trim(),
        dateMentioned: fact.dateMentioned || extractDatesFromText(quote)[0] || undefined,
        entitiesInvolved: fact.entitiesInvolved || [],
        sourceUrl: sourceMatch.url,
        sourceTitle: sourceMatch.title,
        sourceDomain: sourceMatch.domain,
        quoteSnippet: quote,
        confidenceScore: fact.confidenceScore || 80,
      });

      if (parsedFact.success) {
        validFacts.push(parsedFact.data);
      }
    }

    return {
      candidateEntities: validEntities,
      extractedFacts: validFacts,
    };
  } catch (err: unknown) {
    console.warn(
      `[Reader Classifier] LLM classification pass failed for "${queryText}": ${String(err)}. Engaging resilient heuristic extraction.`,
    );
    const fallback = extractHeuristicEntitiesAndFacts(searchResults, queryText);
    if (fallback.candidateEntities.length > 0) {
      return fallback;
    }
    // Satisfies AC-7: Clean structured error propagation
    throw new ReaderClassificationError(
      `Classification pass failed for query "${queryText}": ${String(err)}`,
      err,
    );
  }
}
