import {
  runMasterResearchLoop,
} from "./engine";
import type {
  ResearchEngineOptions,
  ResearchStreamEvent,
  AgentPersona,
} from "@/types/engine";
import type {
  SseEvent,
  TelemetryLog,
  AgentName,
  TelemetryActionType,
} from "@/types/telemetry";

/**
 * State of an actively tracked research investigation in memory.
 */
export interface ActiveResearchRun {
  researchId: string;
  query: string;
  depth: "recon" | "expedition";
  abortController: AbortController;
  subscribers: Set<(event: SseEvent) => void>;
  recentEvents: SseEvent[];
  status: "running" | "completed" | "failed";
  disconnectTimer?: NodeJS.Timeout | null;
  startedAt: number;
  completedAt?: number;
  finalSynthesis?: string;
  confidenceScore?: number;
  error?: string;
}

// Preserve active runs across hot module reloading in development
const globalForCoordinator = globalThis as unknown as {
  _chronocause_active_runs?: Map<string, ActiveResearchRun>;
};

const activeRuns: Map<string, ActiveResearchRun> =
  globalForCoordinator._chronocause_active_runs ?? new Map();

if (process.env.NODE_ENV !== "production") {
  globalForCoordinator._chronocause_active_runs = activeRuns;
}

const MAX_RECENT_EVENTS_BUFFER = 50;
const CLIENT_ABSENCE_GRACE_MS = 60_000; // 60 seconds

/**
 * Map internal agent persona name to canonical telemetry agent name.
 */
function mapAgentPersonaToName(persona: AgentPersona): AgentName {
  switch (persona) {
    case "Architect":
      return "The Architect";
    case "Reader":
      return "The Reader";
    case "Checker":
      return "The Fact Checker";
    case "Visualizer":
      return "The Visualizer";
    default:
      return "The Architect";
  }
}

/**
 * Infer action type from message context or agent name.
 */
function inferActionType(message: string, agent: AgentName): TelemetryActionType {
  const lower = message.toLowerCase();
  if (lower.includes("search") || lower.includes("query") || lower.includes("tavily") || lower.includes("dispatch")) {
    return "search_dispatched";
  }
  if (lower.includes("contradiction") || lower.includes("conflict") || lower.includes("dispute")) {
    return "conflict_raised";
  }
  if (lower.includes("node") || lower.includes("spawn") || lower.includes("entity")) {
    return "node_spawned";
  }
  if (lower.includes("confidence") || lower.includes("score")) {
    return "confidence_update";
  }
  if (lower.includes("concluded") || lower.includes("complete") || lower.includes("goal")) {
    return "goal_reached";
  }
  if (agent === "The Reader") {
    return "source_scraped";
  }
  return "fact_extracted";
}

/**
 * Convert engine yielded events to canonical Server-Sent Events.
 */
export function mapEngineEventToSse(
  event: ResearchStreamEvent,
  researchId: string,
): SseEvent {
  switch (event.type) {
    case "agent_thought": {
      const agentName = mapAgentPersonaToName(event.from);
      const actionType = inferActionType(event.text, agentName);
      const log: TelemetryLog = {
        id: "log_" + Math.random().toString(36).substring(2, 10),
        researchId,
        agentName,
        message: event.text,
        actionType,
        timestamp: event.timestamp || new Date().toISOString(),
      };
      return {
        type: "agent_dialogue",
        data: log,
      };
    }
    case "node_discovered":
      return {
        type: "node_added",
        data: event.node,
      };
    case "edge_discovered":
      return {
        type: "edge_added",
        data: event.edge,
      };
    case "timeline_event":
      return {
        type: "timeline_event_added",
        data: event.event,
      };
    case "confidence_updated":
      return {
        type: "confidence_changed",
        data: {
          confidenceScore: event.confidenceScore,
          reason: event.explanation,
        },
      };
    case "research_completed":
      return {
        type: "completed",
        data: {
          finalSynthesis: event.synthesis,
          totalNodes: event.totalNodes,
          totalEdges: event.totalEdges,
          confidenceScore: event.confidenceScore,
        },
      };
    case "research_error":
      return {
        type: "error",
        data: {
          message: event.error,
          recoverable: !event.isFatal,
        },
      };
  }
}

/**
 * Broadcast an SSE event to all connected subscriber callbacks and buffer it.
 */
function broadcastEvent(run: ActiveResearchRun, sseEvent: SseEvent) {
  // Push into circular recent events buffer
  run.recentEvents.push(sseEvent);
  if (run.recentEvents.length > MAX_RECENT_EVENTS_BUFFER) {
    run.recentEvents.shift();
  }

  // Multicast to every active subscriber
  for (const subscriber of run.subscribers) {
    try {
      subscriber(sseEvent);
    } catch (err) {
      console.error(`[stream-coordinator] Subscriber notification failed for ${run.researchId}:`, err);
    }
  }
}

/**
 * Start autonomous research execution in the background managed by the coordinator.
 * Satisfies AC-1, AC-2, AC-8.
 */
export async function startResearchExecution(
  options: ResearchEngineOptions,
): Promise<{ success: boolean; researchId: string; isNew: boolean }> {
  const existing = activeRuns.get(options.researchId);
  if (existing && existing.status === "running") {
    return { success: true, researchId: options.researchId, isNew: false };
  }

  const abortController = new AbortController();
  const run: ActiveResearchRun = {
    researchId: options.researchId,
    query: options.query,
    depth: options.depth || "recon",
    abortController,
    subscribers: new Set(),
    recentEvents: [],
    status: "running",
    startedAt: Date.now(),
    disconnectTimer: null,
  };

  activeRuns.set(options.researchId, run);

  // Run the multi-agent engine loop asynchronously in the background
  (async () => {
    try {
      const generator = runMasterResearchLoop({
        ...options,
        signal: abortController.signal,
      });

      for await (const rawEvent of generator) {
        if (abortController.signal.aborted) {
          break;
        }

        const sseEvent = mapEngineEventToSse(rawEvent, options.researchId);
        broadcastEvent(run, sseEvent);

        if (sseEvent.type === "completed") {
          run.status = "completed";
          run.finalSynthesis = sseEvent.data.finalSynthesis;
          run.confidenceScore = sseEvent.data.confidenceScore;
          run.completedAt = Date.now();
        } else if (sseEvent.type === "error" && !sseEvent.data.recoverable) {
          run.status = "failed";
          run.error = sseEvent.data.message;
        }
      }

      if (run.status === "running") {
        run.status = "completed";
        run.completedAt = Date.now();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[stream-coordinator] Engine execution error for ${options.researchId}:`, err);
      run.status = "failed";
      run.error = message;

      const fatalErrorEvent: SseEvent = {
        type: "error",
        data: {
          message: `Investigation failed: ${message}`,
          recoverable: false,
        },
      };
      broadcastEvent(run, fatalErrorEvent);
    } finally {
      if (run.disconnectTimer) {
        clearTimeout(run.disconnectTimer);
        run.disconnectTimer = null;
      }
    }
  })();

  return { success: true, researchId: options.researchId, isNew: true };
}

/**
 * Subscribe a client SSE stream controller to an active or buffered research run.
 * Handles automatic catch-up replay and disconnect cancellation timers.
 * Satisfies AC-1, AC-6, AC-8.
 */
export function subscribeToResearch(
  researchId: string,
  listener: (event: SseEvent) => void,
): {
  unsubscribe: () => void;
  isActive: boolean;
  replayEvents: SseEvent[];
  run?: ActiveResearchRun;
} {
  const run = activeRuns.get(researchId);

  if (!run) {
    return {
      unsubscribe: () => {},
      isActive: false,
      replayEvents: [],
    };
  }

  // Clear client absence grace timer since a client is now actively attached
  if (run.disconnectTimer) {
    clearTimeout(run.disconnectTimer);
    run.disconnectTimer = null;
  }

  run.subscribers.add(listener);

  const unsubscribe = () => {
    run.subscribers.delete(listener);

    // If zero clients remain attached to a running investigation, start the 60s grace timer
    if (run.subscribers.size === 0 && run.status === "running") {
      run.disconnectTimer = setTimeout(() => {
        if (run.subscribers.size === 0 && run.status === "running") {
          console.warn(`[stream-coordinator] 60s absence timeout expired for ${researchId}. Aborting.`);
          run.abortController.abort();
          run.status = "failed";
          run.error = "Investigation cancelled after 60 seconds without connected observers.";
        }
      }, CLIENT_ABSENCE_GRACE_MS);
    }
  };

  return {
    unsubscribe,
    isActive: run.status === "running",
    replayEvents: [...run.recentEvents],
    run,
  };
}

/**
 * Cancel an active research run immediately.
 */
export function cancelResearchExecution(researchId: string): boolean {
  const run = activeRuns.get(researchId);
  if (!run) return false;

  if (run.disconnectTimer) {
    clearTimeout(run.disconnectTimer);
    run.disconnectTimer = null;
  }

  run.abortController.abort();
  run.status = "failed";
  run.error = "Investigation manually cancelled.";
  return true;
}

/**
 * Retrieve active run state if present in memory.
 */
export function getActiveResearchRun(researchId: string): ActiveResearchRun | undefined {
  return activeRuns.get(researchId);
}
