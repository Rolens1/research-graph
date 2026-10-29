import { z } from "zod";

/**
 * Chronological Timeline Event Schema
 * Grounded in context/schemas-and-contracts.md Section 2 and Spec 0022
 */
export const timelineEventSchema = z.object({
  id: z.string().uuid().optional(),
  researchId: z.string().min(1),
  nodeId: z.string().optional(),
  eventDate: z.string().min(1),
  parsedTimestamp: z.string().datetime().optional(),
  title: z.string().min(3).max(80),
  description: z.string().min(10).max(300),
  sourceUrl: z.string().url().optional(),
});
export type TimelineEvent = z.infer<typeof timelineEventSchema>;

export const timelineEventListSchema = z.array(timelineEventSchema);
