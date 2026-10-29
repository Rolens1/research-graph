import type { PathwayLedger, CausalGapTarget, EnigmaDeclaration } from "@/types/architect";

const MAX_DIVERGENT_ATTEMPTS = 4;

/**
 * Initializes an empty pathway ledger.
 */
export function createEmptyPathwayLedger(): PathwayLedger {
  return {
    gapAttempts: {},
  };
}

/**
 * Records an attempted divergent pathway branch ID against a specific causal gap.
 */
export function recordPathwayAttempt(
  ledger: PathwayLedger,
  gapId: string,
  branchId: string,
): PathwayLedger {
  const currentAttempts = ledger.gapAttempts[gapId] || [];
  if (currentAttempts.includes(branchId)) {
    return ledger;
  }

  return {
    ...ledger,
    gapAttempts: {
      ...ledger.gapAttempts,
      [gapId]: [...currentAttempts, branchId],
    },
  };
}

/**
 * Returns the number of distinct divergent branches attempted for a given gap.
 */
export function getAttemptCountForGap(ledger: PathwayLedger, gapId: string): number {
  return ledger.gapAttempts[gapId]?.length || 0;
}

/**
 * Checks whether an unbridged gap has reached the 4-pathway divergence cap.
 * If 4 or more distinct branches have failed to resolve it, returns an EnigmaDeclaration.
 */
export function evaluateEnigmaCap(
  ledger: PathwayLedger,
  gap: CausalGapTarget,
): EnigmaDeclaration | null {
  const attempts = ledger.gapAttempts[gap.gapId] || [];

  if (attempts.length >= MAX_DIVERGENT_ATTEMPTS) {
    const questionSubject =
      gap.fromNodeId && gap.toNodeId
        ? `What critical event, covert decision, or missing document bridges '${gap.fromNodeId}' and '${gap.toNodeId}'?`
        : `What foundational origin or catalyst initiated '${gap.toNodeId || gap.gapId}'?`;

    return {
      gapId: gap.gapId,
      unresolvedQuestion: questionSubject,
      attemptedBranchIds: attempts,
      failureSummary: `The engine explored ${attempts.length} divergent investigative pathways targeting gap "${gap.gapId}" without uncovering verified primary sources. Research halted to preserve findings and flag this unresolved enigma for human analysis.`,
    };
  }

  return null;
}
