import { z } from "zod";
import { graphNodeDataSchema, graphEdgeDataSchema } from "./graph";

/**
 * Request payload schema for expanding a node into a rabbit hole.
 * Satisfies AC-2, AC-7.
 */
export const expandRequestSchema = z.object({
  nodeId: z.string().min(1, "Target node ID is required"),
  customFocusAngle: z.string().max(200, "Focus angle cannot exceed 200 characters").optional(),
  existingNodes: z.array(graphNodeDataSchema).optional(),
  existingEdges: z.array(graphEdgeDataSchema).optional(),
});
export type ExpandRequest = z.infer<typeof expandRequestSchema>;

/**
 * Response schema returned by the expansion endpoint.
 * Satisfies AC-2, AC-7.
 */
export const expandResponseSchema = z.object({
  success: z.boolean(),
  parentNodeId: z.string(),
  parentDepthLevel: z.number().int().min(0),
  newDepthLevel: z.number().int().min(1).max(4),
  childNodes: z.array(graphNodeDataSchema),
  addedEdges: z.array(graphEdgeDataSchema),
  agentThoughts: z.array(z.string()).default([]),
  summary: z.string(),
  message: z.string(),
});
export type ExpandResponse = z.infer<typeof expandResponseSchema>;
