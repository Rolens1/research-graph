import { z } from "zod";
import { entityTypeSchema, impactLevelSchema } from "@/types/graph";

/**
 * Key causal driver for the executive decision brief
 */
export const exportKeyDriverSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  entityType: entityTypeSchema,
  confidence: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  impactLevel: impactLevelSchema.optional(),
  depthLevel: z.number().int().default(0),
  sourceCount: z.number().int().default(0),
});
export type ExportKeyDriver = z.infer<typeof exportKeyDriverSchema>;

/**
 * Milestone event in the chronological timeline
 */
export const exportMilestoneSchema = z.object({
  id: z.string().optional(),
  eventDate: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  sourceUrl: z.string().url().optional(),
});
export type ExportMilestone = z.infer<typeof exportMilestoneSchema>;

/**
 * Numbered source citation for audit and verification
 */
export const exportCitationSchema = z.object({
  number: z.number().int().positive(),
  url: z.string().min(1),
  title: z.string().min(1),
  publishedDate: z.string().optional(),
  verbatimSnippet: z.string().min(1),
  credibilityScore: z.number().int().min(0).max(100).default(80),
  domain: z.string().optional(),
});
export type ExportCitation = z.infer<typeof exportCitationSchema>;

/**
 * Full structured payload required to compile the PDF dossier
 */
export const researchSummaryPayloadSchema = z.object({
  id: z.string().min(1),
  query: z.string().min(1),
  depth: z.enum(["recon", "expedition"]).default("expedition"),
  status: z.enum(["running", "completed", "failed"]).default("completed"),
  confidenceScore: z.number().int().min(0).max(100),
  date: z.string().min(1),
  executiveSynthesis: z.string().min(1),
  keyDrivers: z.array(exportKeyDriverSchema).default([]),
  milestones: z.array(exportMilestoneSchema).default([]),
  citations: z.array(exportCitationSchema).default([]),
  stats: z
    .object({
      totalNodes: z.number().int().default(0),
      totalEdges: z.number().int().default(0),
      totalSources: z.number().int().default(0),
      disputedCount: z.number().int().default(0),
    })
    .optional(),
});
export type ResearchSummaryPayload = z.infer<typeof researchSummaryPayloadSchema>;

/**
 * Optional live client graph payload provided for instant PDF compilation
 */
export const exportClientPayloadSchema = z.object({
  query: z.string().optional(),
  depth: z.enum(["recon", "expedition"]).optional(),
  status: z.enum(["running", "completed", "failed"]).optional(),
  confidenceScore: z.number().int().min(0).max(100).optional(),
  nodes: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().optional(),
        entityType: entityTypeSchema.optional(),
        confidence: z.number().optional(),
        summary: z.string().optional(),
        impactLevel: impactLevelSchema.optional(),
        depthLevel: z.number().optional(),
        sources: z
          .array(
            z.object({
              url: z.string().optional(),
              title: z.string().optional(),
              verbatimSnippet: z.string().optional(),
              credibilityScore: z.number().optional(),
              publishedDate: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  timeline: z
    .array(
      z.object({
        id: z.string().optional(),
        eventDate: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        sourceUrl: z.string().optional(),
      }),
    )
    .optional(),
});
export type ExportClientPayload = z.infer<typeof exportClientPayloadSchema>;
