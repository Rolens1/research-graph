import { z } from "zod";
import { graphNodeDataSchema, graphEdgeDataSchema } from "./graph";
import { timelineEventSchema } from "./timeline";

/**
 * Named Agent Personas in the multi-agent investigation system.
 */
export const agentNameSchema = z.enum([
  "The Architect",
  "The Reader",
  "The Fact Checker",
  "The Visualizer",
]);
export type AgentName = z.infer<typeof agentNameSchema>;

/**
 * Action classifications emitted in telemetry dialogue logs.
 */
export const telemetryActionTypeSchema = z.enum([
  "search_dispatched",
  "source_scraped",
  "fact_extracted",
  "conflict_raised",
  "node_spawned",
  "confidence_update",
  "goal_reached",
]);
export type TelemetryActionType = z.infer<typeof telemetryActionTypeSchema>;

/**
 * Dialogue & action telemetry record for live feed and historical persistence.
 */
export const telemetryLogSchema = z.object({
  id: z.string(),
  researchId: z.string(),
  agentName: agentNameSchema,
  message: z.string().min(1),
  actionType: telemetryActionTypeSchema,
  payload: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string(),
});
export type TelemetryLog = z.infer<typeof telemetryLogSchema>;

/**
 * Discriminated Union of all Server-Sent Events (SSE) emitted by the stream route.
 */
export const sseEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("agent_dialogue"),
    data: telemetryLogSchema,
  }),
  z.object({
    type: z.literal("node_added"),
    data: graphNodeDataSchema,
  }),
  z.object({
    type: z.literal("edge_added"),
    data: graphEdgeDataSchema,
  }),
  z.object({
    type: z.literal("timeline_event_added"),
    data: timelineEventSchema,
  }),
  z.object({
    type: z.literal("confidence_changed"),
    data: z.object({
      confidenceScore: z.number().int().min(0).max(100),
      reason: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("completed"),
    data: z.object({
      finalSynthesis: z.string().min(1),
      totalNodes: z.number().int(),
      totalEdges: z.number().int(),
      confidenceScore: z.number().int(),
    }),
  }),
  z.object({
    type: z.literal("error"),
    data: z.object({
      message: z.string(),
      recoverable: z.boolean().default(true),
    }),
  }),
]);
export type SseEvent = z.infer<typeof sseEventSchema>;
