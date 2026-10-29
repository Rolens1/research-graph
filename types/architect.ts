import { z } from "zod";
import { graphNodeDataSchema, graphEdgeDataSchema } from "./graph";

/**
 * Intermediate Causal Gap Target Schema
 * Represents a missing link or unexplained transition between historical milestones.
 */
export const causalGapTargetSchema = z.object({
  gapId: z.string().min(1),
  fromNodeId: z.string().optional(),
  toNodeId: z.string().optional(),
  description: z.string().min(5).max(400),
  temporalWindow: z.string().optional(),
});
export type CausalGapTarget = z.infer<typeof causalGapTargetSchema>;

/**
 * Backward Causal Sub-Query Schema
 * Represents a precision query formulated backwards in time to uncover direct historical antecedents.
 */
export const backwardSubQuerySchema = z.object({
  id: z.string().min(1),
  query: z.string().min(3).max(300),
  targetGap: causalGapTargetSchema,
  temporalAnchor: z.string().min(2).max(150),
  hypothesisRationale: z.string().min(10).max(500),
  pathwayBranchId: z.string().min(1),
  isDivergentProbe: z.boolean().default(false),
});
export type BackwardSubQuery = z.infer<typeof backwardSubQuerySchema>;

/**
 * Unresolved Enigma Declaration Schema
 * Emitted when four divergent branches have failed to bridge a causal gap.
 */
export const enigmaDeclarationSchema = z.object({
  gapId: z.string().min(1),
  unresolvedQuestion: z.string().min(10).max(400),
  attemptedBranchIds: z.array(z.string()).min(4),
  failureSummary: z.string().min(10).max(600),
});
export type EnigmaDeclaration = z.infer<typeof enigmaDeclarationSchema>;

/**
 * Architect Supervisor Plan Output Schema
 * Strict Zod validation contract for LLM generation passes.
 */
export const architectPlanOutputSchema = z.object({
  reasoningSteps: z.array(z.string()).min(1),
  detectedGaps: z.array(causalGapTargetSchema),
  subQueries: z.array(backwardSubQuerySchema).max(2),
  enigma: enigmaDeclarationSchema.optional(),
  isInvestigationComplete: z.boolean().default(false),
  completionReason: z.enum([
    "genesis_linked",
    "enigma_reached",
    "budget_exhausted",
    "in_progress",
  ]).default("in_progress"),
});
export type ArchitectPlanOutput = z.infer<typeof architectPlanOutputSchema>;

/**
 * Pathway Ledger Schema
 * In-memory and persistent tracker of attempted divergent branches per causal gap.
 */
export const pathwayLedgerSchema = z.object({
  gapAttempts: z.record(z.string(), z.array(z.string())),
});
export type PathwayLedger = z.infer<typeof pathwayLedgerSchema>;

/**
 * Architect Supervisor Input Options
 */
export const architectPlanInputSchema = z.object({
  userQuery: z.string().min(1),
  nodes: z.array(graphNodeDataSchema).default([]),
  edges: z.array(graphEdgeDataSchema).default([]),
  ledger: pathwayLedgerSchema.default({ gapAttempts: {} }),
  iteration: z.number().int().min(1).max(5).default(1),
  preferredProvider: z.string().optional(),
});
export type ArchitectPlanInput = z.input<typeof architectPlanInputSchema>;
