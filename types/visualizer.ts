import { z } from "zod";
import {
  graphNodeDataSchema,
  graphEdgeDataSchema,
  impactLevelSchema,
  pathwayRoleSchema,
} from "./graph";
import {
  verifiedEntitySchema,
  verifiedCausalRelationSchema,
  granularAmbiguitySchema,
  alternateCausalBranchSchema,
} from "./fact-checker";
import { timelineEventSchema } from "./timeline";
import { causalGapTargetSchema, enigmaDeclarationSchema } from "./architect";

/**
 * Visualizer Input Contract
 * Grounded in Spec 0022: AC-1 through AC-8
 */
export const visualizerInputSchema = z.object({
  researchId: z.string().min(1),
  userQuery: z.string().min(1),
  iteration: z.number().int().min(1).max(3).default(1),
  verifiedEntities: z.array(verifiedEntitySchema).default([]),
  verifiedRelations: z.array(verifiedCausalRelationSchema).default([]),
  discoveredAmbiguities: z.array(granularAmbiguitySchema).default([]),
  alternateBranches: z.array(alternateCausalBranchSchema).default([]),
  existingNodes: z.array(graphNodeDataSchema).optional().default([]),
  existingEdges: z.array(graphEdgeDataSchema).optional().default([]),
  unbridgedGaps: z.array(causalGapTargetSchema).optional().default([]),
  enigmaDeclaration: enigmaDeclarationSchema.optional(),
  isEnigmaTriggered: z.boolean().optional().default(false),
  preferredProvider: z.string().optional(),
});
export type VisualizerInput = z.infer<typeof visualizerInputSchema>;

/**
 * Impact & Pathway Role Classification per Entity
 */
export const entityVisualClassificationSchema = z.object({
  entityId: z.string().min(1),
  impactLevel: impactLevelSchema,
  pathwayRole: pathwayRoleSchema,
  justification: z.string().max(250).optional(),
});
export type EntityVisualClassification = z.infer<typeof entityVisualClassificationSchema>;

/**
 * Model Visualizer Pass Schema
 * Extracted from LLM generation before deterministic assembly.
 */
export const modelVisualizerOutputSchema = z.object({
  reasoningSteps: z.array(z.string()).min(1),
  entityClassifications: z.array(entityVisualClassificationSchema).default([]),
  sliceSummary: z.string().min(10).max(800),
});
export type ModelVisualizerOutput = z.infer<typeof modelVisualizerOutputSchema>;

/**
 * Visualizer Output Contract
 * Delivered to Master Engine and Realtime Canvas Stream.
 */
export const visualizerOutputSchema = z.object({
  nodes: z.array(graphNodeDataSchema),
  edges: z.array(graphEdgeDataSchema),
  timelineEvents: z.array(timelineEventSchema),
  enigmaNodes: z.array(graphNodeDataSchema).default([]),
  summary: z.string().min(10),
  reasoningSteps: z.array(z.string()),
  executionTimeMs: z.number().nonnegative(),
});
export type VisualizerOutput = z.infer<typeof visualizerOutputSchema>;
