import { z } from "zod";

/**
 * Supported Entity Types on the Knowledge Canvas
 */
export const entityTypeSchema = z.enum([
  "actor", // Individuals, organizations, states, companies (e.g. "BYD", "Napoleon")
  "event", // Dated milestones, battles, announcements, summits
  "technology", // Hardware, protocols, patents, batteries, algorithms
  "decision", // Policies, treaties, tariffs, strategic pivots
  "dispute", // Active controversies, contested claims, divergent data
]);
export type EntityType = z.infer<typeof entityTypeSchema>;

/**
 * Causal & Relational Edge Types
 */
export const relationTypeSchema = z.enum([
  "causes", // Direct cause-and-effect ("Subsidies -> Price Drop")
  "blocks", // Obstacle, sanction, tariff, or prohibition ("Tariff -> Import Freeze")
  "finances", // Capital flow, funding, state subsidy ("State Bank -> Factory")
  "contradicts", // Opposing factual claims between sources ("Claim A <-> Claim B")
  "leads_to", // Sequential or indirect influence ("Inflation -> Public Backlash")
]);
export type RelationType = z.infer<typeof relationTypeSchema>;

/**
 * Individual Verified Source Citation
 */
export const sourceCitationSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().url(),
  title: z.string().min(1),
  publishedDate: z.string().optional(),
  verbatimSnippet: z.string().min(10), // Must contain verbatim excerpt for credibility
  credibilityScore: z.number().int().min(0).max(100).default(80),
});
export type SourceCitation = z.infer<typeof sourceCitationSchema>;

/**
 * Impact Level for Constellation Star Sizing and Highlights
 */
export const impactLevelSchema = z.enum(["critical", "high", "medium", "low"]);
export type ImpactLevel = z.infer<typeof impactLevelSchema>;

/**
 * Graph Node Schema (Data consumed by React Flow Custom Node)
 */
export const graphNodeDataSchema = z.object({
  id: z.string().regex(/^[a-z]+_[a-z0-9-]+$/, "ID must be slug format: type_kebab-name"),
  label: z.string().min(1).max(60),
  entityType: entityTypeSchema,
  summary: z.string().min(10).max(300),
  confidence: z.number().int().min(0).max(100),
  depthLevel: z.number().int().min(0).default(0), // 0 = root causality, 1+ = rabbit hole
  parentNodeId: z.string().nullable().default(null),
  isUserAdded: z.boolean().default(false),
  isDisputed: z.boolean().default(false).optional(),
  impactLevel: impactLevelSchema.optional(),
  timestamp: z.string().optional(),
  backdropUrl: z.string().optional(),
  sources: z.array(sourceCitationSchema).min(1, "Every node must have at least one source"),
});
export type GraphNodeData = z.infer<typeof graphNodeDataSchema>;

/**
 * Graph Edge Schema (Data consumed by React Flow Custom Edge)
 */
export const graphEdgeDataSchema = z.object({
  id: z.string(), // e.g. "org_byd->tech_sodium"
  source: z.string(),
  target: z.string(),
  relationType: relationTypeSchema,
  label: z.string().min(1).max(50), // Displayed on the connecting arrow
  isDisputed: z.boolean().default(false), // True if sources contradict each other
  explanation: z.string().min(10).max(250),
});
export type GraphEdgeData = z.infer<typeof graphEdgeDataSchema>;

/**
 * Full Extracted Graph Slice from LLM
 */
export const extractedGraphSchema = z.object({
  nodes: z.array(graphNodeDataSchema),
  edges: z.array(graphEdgeDataSchema),
});
export type ExtractedGraph = z.infer<typeof extractedGraphSchema>;
