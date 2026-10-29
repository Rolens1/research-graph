import {
  type ReaderInput,
  type ReaderOutput,
  type ReaderQueryExecutionResult,
  readerInputSchema,
  readerOutputSchema,
} from "@/types/reader";
import { searchWeb } from "@/lib/search-provider";
import {
  identifyRabbitHoleLeads,
  deduplicateCandidateEntities,
} from "./reader-heuristics";
import { classifySearchContent } from "./reader-classifier";

/**
 * Executes autonomous web research for backward causal sub-queries.
 * Satisfies AC-1 to AC-8:
 * - Parallel execution via Promise.allSettled with 10-second aggregate timeout.
 * - Selective full markdown content extraction.
 * - Hybrid regex date parsing with multi-provider LLM entity classification.
 * - Entity budget of <= 6 per sub-query.
 * - Dual qualification rabbit hole scoring (0.35 to 0.69).
 * - Exact source URL and verbatim quote attribution.
 * - Strict error propagation on classifier failure.
 * - Realtime thought telemetry for the Live Terminal.
 */
export async function executeReaderInvestigation(
  input: ReaderInput,
  options?: { signal?: AbortSignal },
): Promise<ReaderOutput> {
  const startTime = Date.now();
  const reasoningSteps: string[] = [];

  // 1. Validate Input
  const validatedInput = readerInputSchema.parse(input);
  const { subQueries, existingGraphKeywords, includeFullContent, preferredProvider } =
    validatedInput;

  reasoningSteps.push(
    `Received ${subQueries.length} backward sub-queries from The Architect. Initializing parallel search dispatch.`,
  );

  // 2. Deadlines: 10-Second Aggregate Search Timeout (AC-1) and 25-Second Overall Pipeline Deadline
  const pipelineTimeoutMs = 25000;
  const searchTimeoutMs = 10000;
  const pipelineSignal = AbortSignal.timeout(pipelineTimeoutMs);
  let effectivePipelineSignal: AbortSignal = pipelineSignal;

  if (options?.signal) {
    if (typeof AbortSignal.any === "function") {
      effectivePipelineSignal = AbortSignal.any([pipelineSignal, options.signal]);
    } else {
      const controller = new AbortController();
      const abort = () => controller.abort();
      pipelineSignal.addEventListener("abort", abort, { once: true });
      options.signal.addEventListener("abort", abort, { once: true });
      effectivePipelineSignal = controller.signal;
    }
  }

  if (effectivePipelineSignal.aborted) {
    reasoningSteps.push("Execution aborted prior to dispatch.");
    return {
      queryResults: [],
      allEntities: [],
      allFacts: [],
      allRabbitHoles: [],
      reasoningSteps,
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Dedicated search signal strictly bounded to 10 seconds (AC-1)
  const searchTimeoutSignal = AbortSignal.timeout(searchTimeoutMs);
  let effectiveSearchSignal: AbortSignal = searchTimeoutSignal;
  if (typeof AbortSignal.any === "function") {
    effectiveSearchSignal = AbortSignal.any([searchTimeoutSignal, effectivePipelineSignal]);
  } else {
    const controller = new AbortController();
    const abort = () => controller.abort();
    searchTimeoutSignal.addEventListener("abort", abort, { once: true });
    effectivePipelineSignal.addEventListener("abort", abort, { once: true });
    effectiveSearchSignal = controller.signal;
  }

  // 3. Dispatch Parallel Web Searches with Resilient Fallback
  reasoningSteps.push(
    `Dispatching ${subQueries.length} concurrent web queries via distributed search engine (10s deadline).`,
  );

  const searchPromises = subQueries.map(async (sq) => {
    const { results } = await searchWeb(sq.query, {
      depth: "advanced",
      maxResults: 4,
      includeRawContent: includeFullContent,
      relatedNodeContext: existingGraphKeywords,
      signal: effectiveSearchSignal,
    });
    return {
      query: sq,
      results,
    };
  });

  const settledSearches = await Promise.allSettled(searchPromises);

  // 4. Process Settled Results with Partial Query Resilience (AC-1)
  const queryResults: ReaderQueryExecutionResult[] = [];

  for (let i = 0; i < settledSearches.length; i++) {
    const settled = settledSearches[i];
    const originalQuery = subQueries[i];

    if (settled.status === "rejected") {
      reasoningSteps.push(
        `Search for sub-query "${originalQuery.query.slice(0, 50)}…" failed or timed out: ${String(settled.reason)}. Proceeding with peer results.`,
      );
      continue;
    }

    const { query, results } = settled.value;
    const domains = Array.from(new Set(results.map((r) => r.domain))).slice(0, 3);
    reasoningSteps.push(
      `Retrieved ${results.length} sources for "${query.query.slice(0, 60)}" across [${domains.join(", ") || "none"}].`,
    );

    if (results.length === 0) {
      queryResults.push({
        queryId: query.id,
        queryText: query.query,
        searchResultsCount: 0,
        extractedFacts: [],
        candidateEntities: [],
        rabbitHoleLeads: [],
        rawSearchResults: [],
      });
      continue;
    }

    // 5. Identify Candidate Rabbit Hole Leads (AC-5)
    const rabbitHoleLeads = identifyRabbitHoleLeads(
      results,
      existingGraphKeywords,
      query.temporalAnchor,
    );

    if (rabbitHoleLeads.length > 0) {
      reasoningSteps.push(
        `Identified ${rabbitHoleLeads.length} candidate rabbit hole lead(s) for "${query.query.slice(0, 40)}…".`,
      );
    }

    // 6. Fast Hybrid Classification (AC-3, AC-4, AC-6, AC-7)
    // Throws ReaderClassificationError on failure per AC-7
    const { candidateEntities, extractedFacts } = await classifySearchContent(
      results,
      query.query,
      {
        preferredProvider,
        signal: effectivePipelineSignal,
      },
    );

    reasoningSteps.push(
      `Extracted ${candidateEntities.length} candidate entities and ${extractedFacts.length} factual milestones for query: ${query.id}.`,
    );

    queryResults.push({
      queryId: query.id,
      queryText: query.query,
      searchResultsCount: results.length,
      extractedFacts,
      candidateEntities,
      rabbitHoleLeads,
      rawSearchResults: results,
    });
  }

  // 7. Aggregate and Deduplicate Output Across Queries
  const rawEntities = queryResults.flatMap((r) => r.candidateEntities);
  const allEntities = deduplicateCandidateEntities(rawEntities);

  const factMap = new Map<string, (typeof queryResults)[0]["extractedFacts"][0]>();
  for (const q of queryResults) {
    for (const f of q.extractedFacts) {
      const key = `${f.sourceUrl}::${f.statement.slice(0, 40).toLowerCase()}`;
      if (!factMap.has(key)) {
        factMap.set(key, f);
      }
    }
  }
  const allFacts = Array.from(factMap.values());

  const rabbitMap = new Map<string, (typeof queryResults)[0]["rabbitHoleLeads"][0]>();
  for (const q of queryResults) {
    for (const rh of q.rabbitHoleLeads) {
      if (!rabbitMap.has(rh.url)) {
        rabbitMap.set(rh.url, rh);
      }
    }
  }
  const allRabbitHoles = Array.from(rabbitMap.values());

  const executionTimeMs = Date.now() - startTime;
  reasoningSteps.push(
    `Investigation step complete in ${executionTimeMs}ms. Synthesized ${allEntities.length} unique entities, ${allFacts.length} facts, and ${allRabbitHoles.length} rabbit hole leads.`,
  );

  return readerOutputSchema.parse({
    queryResults,
    allEntities,
    allFacts,
    allRabbitHoles,
    reasoningSteps,
    executionTimeMs,
  });
}
