import { z } from "zod";
import {
  entityTypeSchema,
  graphNodeDataSchema,
  graphEdgeDataSchema,
} from "./graph";

/**
 * Supported User Hypothesis Mutation Actions
 */
export const mutationActionTypeSchema = z.enum([
  "add_node",
  "exclude_node",
  "restore_node",
]);
export type MutationActionType = z.infer<typeof mutationActionTypeSchema>;

/**
 * Payload for adding a user hypothesis node
 */
export const addNodePayloadSchema = z.object({
  label: z.string().min(1, "Label is required").max(60, "Label cannot exceed 60 characters"),
  entityType: entityTypeSchema,
  summary: z.string().min(10, "Summary must be at least 10 characters").max(300, "Summary cannot exceed 300 characters"),
  proposedConnections: z.array(z.string()).optional(),
});
export type AddNodePayload = z.infer<typeof addNodePayloadSchema>;

/**
 * Payload for excluding a node from the causal chain
 */
export const excludeNodePayloadSchema = z.object({
  nodeId: z.string().min(1, "Node ID is required"),
  reason: z.string().max(200).optional(),
});
export type ExcludeNodePayload = z.infer<typeof excludeNodePayloadSchema>;

/**
 * Payload for restoring a previously excluded node
 */
export const restoreNodePayloadSchema = z.object({
  nodeId: z.string().min(1, "Node ID is required"),
});
export type RestoreNodePayload = z.infer<typeof restoreNodePayloadSchema>;

/**
 * Full Mutation Request Schema
 */
export const mutationRequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("add_node"),
    payload: addNodePayloadSchema,
    existingNodes: z.array(graphNodeDataSchema).optional(),
    existingEdges: z.array(graphEdgeDataSchema).optional(),
  }),
  z.object({
    action: z.literal("exclude_node"),
    payload: excludeNodePayloadSchema,
    existingNodes: z.array(graphNodeDataSchema).optional(),
    existingEdges: z.array(graphEdgeDataSchema).optional(),
  }),
  z.object({
    action: z.literal("restore_node"),
    payload: restoreNodePayloadSchema,
    existingNodes: z.array(graphNodeDataSchema).optional(),
    existingEdges: z.array(graphEdgeDataSchema).optional(),
  }),
]);
export type MutationRequest = z.infer<typeof mutationRequestSchema>;

/**
 * Mutation Response Schema
 */
export const mutationResponseSchema = z.object({
  success: z.boolean(),
  action: mutationActionTypeSchema,
  affectedNodeId: z.string(),
  affectedNode: graphNodeDataSchema.optional(),
  addedEdges: z.array(graphEdgeDataSchema).optional(),
  severedEdgeIds: z.array(z.string()).default([]),
  pathBroken: z.boolean().default(false),
  brokenPathSummary: z.string().optional(),
  agentThoughts: z.array(z.string()).default([]),
  message: z.string(),
});
export type MutationResponse = z.infer<typeof mutationResponseSchema>;
