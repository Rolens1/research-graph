import { z } from "zod";

/**
 * Clean Normalized Search Result Schema
 * Grounded in Spec 0018: AC-1, AC-3, AC-6
 */
export const cleanSearchResultSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  domain: z.string().min(1),
  content: z.string().min(1),
  score: z.number().min(0).max(1),
  publishedDate: z.string().optional(),
  isRabbitHoleLead: z.boolean().optional(),
});
export type CleanSearchResult = z.infer<typeof cleanSearchResultSchema>;

/**
 * Tavily Search Options Schema
 */
export const tavilySearchOptionsSchema = z.object({
  depth: z.enum(["basic", "advanced"]).optional().default("basic"),
  maxResults: z.number().int().min(1).max(20).optional().default(4),
  minScore: z.number().min(0).max(1).optional(),
  relatedNodeContext: z.array(z.string()).optional(),
  includeRawContent: z.boolean().optional().default(false),
});
export type TavilySearchOptionsInput = z.input<typeof tavilySearchOptionsSchema>;

export type TavilySearchOptions = TavilySearchOptionsInput & {
  signal?: AbortSignal;
};
