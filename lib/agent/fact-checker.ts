import {
  factCheckerInputSchema,
  factCheckerOutputSchema,
  type FactCheckerInput,
  type FactCheckerOutput,
  type GranularAmbiguity,
} from "@/types/fact-checker";
import {
  clusterEntities,
  calculateInvestigationConfidence,
} from "./fact-checker-scoring";
import { evaluateCausalContradictions } from "./fact-checker-contradictions";

/**
 * Custom Error for Fact Checker Agent failures.
 */
export class FactCheckerExecutionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(`[Fact Checker Error] ${message}`);
    this.name = "FactCheckerExecutionError";
  }
}

/**
 * Main Fact Checker Orchestration Function.
 * Satisfies AC-1 through AC-8.
 */
export async function executeFactCheck(
  rawInput: FactCheckerInput,
  options?: {
    signal?: AbortSignal;
    onThought?: (step: string) => void;
  },
): Promise<FactCheckerOutput> {
  const startTime = Date.now();
  const reasoningSteps: string[] = [];

  const logThought = (msg: string) => {
    reasoningSteps.push(msg);
    if (options?.onThought) {
      try {
        options.onThought(msg);
      } catch {
        // Silently ignore telemetry listener failures
      }
    }
  };

  try {
    const input = factCheckerInputSchema.parse(rawInput);
    const candidateCount = input.candidateEntities.length;
    const factCount = input.extractedFacts.length;

    logThought(
      `[Fact Checker] Starting verification pass across ${candidateCount} candidate entities and ${factCount} extracted facts.`,
    );

    // 1. Entity Clustering & Deterministic Field Ambiguity Detection (AC-1, AC-2, AC-3)
    const verifiedEntities = clusterEntities(input.candidateEntities, input.extractedFacts);
    const discoveredAmbiguities: GranularAmbiguity[] = [];

    for (const ent of verifiedEntities) {
      if (ent.ambiguities && ent.ambiguities.length > 0) {
        for (const amb of ent.ambiguities) {
          discoveredAmbiguities.push(amb);
          logThought(
            `[Fact Checker] Flagged granular ambiguity on "${ent.name}" (field: ${amb.field}): [${amb.candidates.join(", ")}]. Preserving entity card validity.`,
          );
        }
      }
    }

    logThought(
      `[Fact Checker] Corroborated ${verifiedEntities.length} distinct entities. Found ${discoveredAmbiguities.length} secondary field ambiguities.`,
    );

    // 2. Causal Contradiction Analysis & Alternate Branch Synthesis (AC-4, AC-5, AC-6)
    logThought(`[Fact Checker] Initiating cross-source causal relationship and contradiction analysis.`);
    const contradictionResult = await evaluateCausalContradictions(
      verifiedEntities,
      input.extractedFacts,
      {
        preferredProvider: input.preferredProvider,
        signal: options?.signal,
      },
    );

    const { relations, alternateBranches, method } = contradictionResult;

    if (method === "heuristic_fallback") {
      logThought(`[Fact Checker] Provider fallback engaged: heuristic consensus evaluated relationships.`);
    }

    if (alternateBranches.length > 0) {
      logThought(
        `[Fact Checker] Direct causal contradiction identified. Structured ${alternateBranches.length} parallel alternate branches for canvas evaluation.`,
      );
      for (const branch of alternateBranches) {
        logThought(`[Fact Checker] Branch: "${branch.hypothesisName}" — ${branch.explanation.slice(0, 100)}...`);
      }
    } else {
      logThought(`[Fact Checker] No irreconcilable causal contradictions detected in active facts.`);
    }

    // 3. Overall Research Confidence Synthesis (AC-7)
    const { overallScore, corroborationRatio } = calculateInvestigationConfidence(
      verifiedEntities,
      relations,
    );

    logThought(
      `[Fact Checker] Global evidentiary confidence synthesized: ${overallScore}% (Corroboration density: ${(corroborationRatio * 100).toFixed(0)}%).`,
    );

    const executionTimeMs = Date.now() - startTime;
    logThought(`[Fact Checker] Verification cycle completed in ${executionTimeMs}ms.`);

    const outputPayload: FactCheckerOutput = {
      verifiedEntities,
      verifiedRelations: relations,
      discoveredAmbiguities,
      alternateBranches: alternateBranches.slice(0, 2),
      overallConfidenceScore: overallScore,
      corroborationRatio,
      reasoningSteps,
      executionTimeMs,
    };

    return factCheckerOutputSchema.parse(outputPayload);
  } catch (err: unknown) {
    if (err instanceof FactCheckerExecutionError) throw err;
    throw new FactCheckerExecutionError(
      `Fact checker cycle failed: ${err instanceof Error ? err.message : String(err)}`,
      err,
    );
  }
}
