import { z } from "zod";
import { entityTypeSchema } from "./graph";

/**
 * 1. Start a New Investigation Session
 */
export const startResearchRequestSchema = z.object({
  query: z.string().min(5, "Investigation topic must be at least 5 characters").max(500),
  depth: z.enum(["recon", "expedition"]).default("recon"),
  subQueries: z.array(z.string().min(3).max(200)).max(6).optional(),
});
export type StartResearchRequest = z.infer<typeof startResearchRequestSchema>;

/**
 * 2. Rabbit Hole Expansion Request (Deep diving into a specific node)
 */
export const expandNodeRequestSchema = z.object({
  researchId: z.string().uuid(),
  nodeId: z.string().regex(/^[a-z]+_[a-z0-9-]+$/),
  customPrompt: z.string().max(200).optional(), // Optional angle specified by user
});
export type ExpandNodeRequest = z.infer<typeof expandNodeRequestSchema>;

/**
 * 3. User Node Mutation (Add / Remove manual hypothesis)
 */
export const userNodeMutationSchema = z.object({
  researchId: z.string().uuid(),
  action: z.enum(["add", "remove"]),
  nodeId: z.string(),
  label: z.string().min(1).max(60).optional(),
  entityType: entityTypeSchema.optional(),
  summary: z.string().max(300).optional(),
});
export type UserNodeMutation = z.infer<typeof userNodeMutationSchema>;

/**
 * 4. Node-Scoped Contextual Chat (Asking questions strictly scoped to a node)
 */
export const nodeChatRequestSchema = z.object({
  researchId: z.string().uuid(),
  nodeId: z.string(),
  message: z.string().min(1).max(1000),
});
export type NodeChatRequest = z.infer<typeof nodeChatRequestSchema>;
