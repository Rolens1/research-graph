import { z } from "zod";
import { candidateEntitySchema, extractedFactSchema } from "./reader";
import { sourceCitationSchema } from "./graph";

/**
 * Granular Field Level Ambiguity Schema
 * Captures secondary attribute variations (dates, names, dollar amounts) without invalidating the entity.
 */
export const granularAmbiguitySchema = z.object({
  field: z.string().min(1).max(80),
  candidates: z.array(z.string()).min(2),
  reason: z.string().min(5).max(300),
  detectedInSources: z.array(z.string().url()).default([]),
});
export type GranularAmbiguity = z.infer<typeof granularAmbiguitySchema>;

/**
 * Verified Entity Schema
 * Represents an entity corroborated across multiple sources and scored for confidence.
 */
export const verifiedEntitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  entityType: z.enum(["actor", "event", "technology", "decision", "dispute"]),
  summary: z.string().min(5).max(500),
  confidenceScore: z.number().int().min(0).max(100),
  temporalAnchor: z.string().optional(),
  corroboratingDomains: z.array(z.string()),
  sources: z.array(sourceCitationSchema),
  ambiguities: z.array(granularAmbiguitySchema).default([]),
  isContested: z.boolean().default(false),
});
export type VerifiedEntity = z.infer<typeof verifiedEntitySchema>;

/**
 * Alternate Causal Branch Schema
 * Represents one of up to two parallel competing causal explanations for side by side evaluation.
 */
export const alternateCausalBranchSchema = z.object({
  branchId: z.string().min(1),
  hypothesisName: z.string().min(3).max(120),
  summary: z.string().min(10).max(400),
  sourceEntityId: z.string(),
  targetEntityId: z.string(),
  relationType: z.enum(["causes", "blocks", "finances", "contradicts", "leads_to"]),
  supportingDomains: z.array(z.string()),
  isDisputed: z.boolean().default(true),
  explanation: z.string().min(10).max(500),
});
export type AlternateCausalBranch = z.infer<typeof alternateCausalBranchSchema>;

/**
 * Verified Causal Relation Schema
 * Represents a verified or disputed link between two entities, optionally holding alternate branches.
 */
export const verifiedCausalRelationSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  relationType: z.enum(["causes", "blocks", "finances", "contradicts", "leads_to"]),
  label: z.string().min(1).max(60),
  confidence: z.number().int().min(0).max(100),
  isDisputed: z.boolean().default(false),
  explanation: z.string().min(5).max(400),
  alternateBranches: z.array(alternateCausalBranchSchema).max(2).default([]),
});
export type VerifiedCausalRelation = z.infer<typeof verifiedCausalRelationSchema>;

/**
 * Fact Checker Output Schema
 * Output payload returned after corroboration, ambiguity extraction, and contradiction analysis.
 */
export const factCheckerOutputSchema = z.object({
  verifiedEntities: z.array(verifiedEntitySchema),
  verifiedRelations: z.array(verifiedCausalRelationSchema),
  discoveredAmbiguities: z.array(granularAmbiguitySchema),
  alternateBranches: z.array(alternateCausalBranchSchema).max(2),
  overallConfidenceScore: z.number().int().min(0).max(100),
  corroborationRatio: z.number().min(0).max(1),
  reasoningSteps: z.array(z.string()).min(1),
  executionTimeMs: z.number().int().min(0),
});
export type FactCheckerOutput = z.infer<typeof factCheckerOutputSchema>;

/**
 * Fact Checker Input Schema
 * Input provided to the fact checking agent from The Reader and active investigation context.
 */
export const factCheckerInputSchema = z.object({
  candidateEntities: z.array(candidateEntitySchema).default([]),
  extractedFacts: z.array(extractedFactSchema).default([]),
  existingKeywords: z.array(z.string()).default([]),
  preferredProvider: z.string().optional(),
});
export type FactCheckerInput = z.input<typeof factCheckerInputSchema>;
