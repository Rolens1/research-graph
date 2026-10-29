import { z } from "zod";
import type { GraphNodeData, GraphEdgeData } from "./graph";
import type { TimelineEvent } from "./timeline";
import type { PathwayLedger, CausalGapTarget } from "./architect";

/**
 * Options configuring a master research engine execution cycle.
 */
export const researchEngineOptionsSchema = z.object({
  researchId: z.string().min(1),
  query: z.string().min(2),
  depth: z.enum(["recon", "expedition"]).default("recon"),
  maxIterations: z.number().int().min(1).max(3).optional(),
  maxQueriesBudget: z.number().int().min(1).max(12).default(12),
  preferredProvider: z.string().optional(),
});
export type ResearchEngineOptions = z.infer<typeof researchEngineOptionsSchema> & {
  signal?: AbortSignal;
};

/**
 * Agent persona names contributing to telemetry.
 */
export type AgentPersona = "Architect" | "Reader" | "Checker" | "Visualizer";

/**
 * Realtime stream event union yielded by the engine generator.
 */
export type ResearchStreamEvent =
  | {
      type: "agent_thought";
      from: AgentPersona;
      text: string;
      timestamp: string;
    }
  | {
      type: "node_discovered";
      node: GraphNodeData;
    }
  | {
      type: "edge_discovered";
      edge: GraphEdgeData;
    }
  | {
      type: "timeline_event";
      event: TimelineEvent;
    }
  | {
      type: "confidence_updated";
      confidenceScore: number;
      explanation?: string;
    }
  | {
      type: "research_completed";
      synthesis: string;
      totalNodes: number;
      totalEdges: number;
      confidenceScore: number;
      executionTimeMs: number;
    }
  | {
      type: "research_error";
      error: string;
      isFatal: boolean;
    };

/**
 * Internal accumulated state of the research investigation.
 */
export interface ResearchEngineState {
  researchId: string;
  query: string;
  iteration: number;
  confidenceScore: number;
  totalQueriesExecuted: number;
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  timelineEvents: TimelineEvent[];
  unbridgedGaps: CausalGapTarget[];
  pathwayLedger: PathwayLedger;
  synthesis: string;
  status: "running" | "completed" | "failed";
  completionReason?: string;
}
