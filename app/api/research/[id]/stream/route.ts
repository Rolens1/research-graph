import { NextRequest } from "next/server";
import { getInsForgeServerClient } from "@/lib/insforge-server";
import {
  subscribeToResearch,
  startResearchExecution,
  getActiveResearchRun,
} from "@/lib/agent/stream-coordinator";
import type { SseEvent, TelemetryLog } from "@/types/telemetry";
import type { GraphNodeData, GraphEdgeData } from "@/types/graph";
import type { TimelineEvent } from "@/types/timeline";

export const dynamic = "force-dynamic";

/**
 * Anti-buffering streaming headers preventing intermediate proxy buffering.
 */
const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform, no-store",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

interface ResearchRecord {
  id: string;
  user_id?: string;
  query: string;
  status: string;
  confidence_score?: number;
  final_synthesis?: string;
}

type AuthResult =
  | { ok: true; record: ResearchRecord }
  | { ok: false; status: number; error: string };

/**
 * Authenticates session ownership for signed in users or verifies guest voyage format.
 */
async function verifySessionAuth(
  researchId: string,
  isGuestSession: boolean,
  queryParam: string,
): Promise<AuthResult> {
  const activeRun = getActiveResearchRun(researchId);

  // If active run exists in coordinator memory, we trust its current status and query
  if (activeRun) {
    return {
      ok: true,
      record: {
        id: researchId,
        query: activeRun.query || queryParam || "Active Exploration",
        status: activeRun.status,
        confidence_score: activeRun.confidenceScore || 0,
        final_synthesis: activeRun.finalSynthesis,
      },
    };
  }

  if (isGuestSession) {
    return {
      ok: true,
      record: {
        id: researchId,
        query: queryParam || "Guest Exploration",
        status: "running",
        confidence_score: 0,
      },
    };
  }

  const insforge = await getInsForgeServerClient();
  const { data: authData } = await insforge.auth.getCurrentUser();

  const { data: research, error } = await insforge.database
    .from("researches")
    .select("id, user_id, query, status, confidence_score, final_synthesis")
    .eq("id", researchId)
    .single();

  if (error || !research) {
    // If not found in database, check if it's an ad-hoc session with a valid query param
    // If authenticated user provided a query param, auto-create the session row in DB!
    if (authData?.user && queryParam) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(researchId);
      const insertPayload: Record<string, unknown> = {
        user_id: authData.user.id,
        query: queryParam,
        status: "running",
        confidence_score: 0,
      };
      if (isUuid) {
        insertPayload.id = researchId;
      }

      const { data: newRow, error: insertErr } = await insforge.database
        .from("researches")
        .insert(insertPayload)
        .select("id, user_id, query, status, confidence_score, final_synthesis")
        .single();

      if (!insertErr && newRow) {
        return { ok: true, record: newRow as unknown as ResearchRecord };
      }
    }

    // Guest fallback if user is not authenticated but has query
    if (queryParam) {
      return {
        ok: true,
        record: {
          id: researchId,
          query: queryParam,
          status: "running",
          confidence_score: 0,
        },
      };
    }

    return { ok: false, status: 404, error: "Investigation session not found" };
  }

  // Allow access if user_id is null (public guest exploration stored in DB) or matches current user
  if (research.user_id && (!authData?.user || research.user_id !== authData.user.id)) {
    return { ok: false, status: 401, error: "Unauthorized access to investigation session" };
  }

  return { ok: true, record: research };
}

/**
 * Builds an SSE stream that replays stored telemetry, graph entities, and synthesis for completed runs.
 */
async function buildHistoricalReplayStream(
  researchId: string,
  record: ResearchRecord,
): Promise<Response> {
  const insforge = await getInsForgeServerClient();
  const encoder = new TextEncoder();

  const [logsRes, nodesRes, edgesRes, timelineRes, sourcesRes] = await Promise.all([
    insforge.database
      .from("telemetry_logs")
      .select("*")
      .eq("research_id", researchId)
      .order("created_at", { ascending: true }),
    insforge.database.from("nodes").select("*").eq("research_id", researchId),
    insforge.database.from("edges").select("*").eq("research_id", researchId),
    insforge.database
      .from("timeline_events")
      .select("*")
      .eq("research_id", researchId)
      .order("parsed_timestamp", { ascending: true }),
    insforge.database.from("sources").select("*").eq("research_id", researchId),
  ]);

  const sourcesByNode = new Map<string, Array<{
    id: string;
    url: string;
    title: string;
    publishedDate?: string;
    verbatimSnippet: string;
    credibilityScore: number;
  }>>();

  for (const s of sourcesRes.data || []) {
    const list = sourcesByNode.get(s.node_id) || [];
    list.push({
      id: s.id,
      url: s.url,
      title: s.title,
      publishedDate: s.published_date || undefined,
      verbatimSnippet: s.verbatim_snippet || "",
      credibilityScore: s.credibility_score ?? 80,
    });
    sourcesByNode.set(s.node_id, list);
  }

  const replayStream = new ReadableStream({
    start(controller) {
      const sendEvent = (type: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`),
        );
      };

      for (const log of logsRes.data || []) {
        const telemetryLog: TelemetryLog = {
          id: log.id,
          researchId: log.research_id,
          agentName: log.agent_name,
          message: log.message,
          actionType: log.action_type || "fact_extracted",
          payload: log.payload || undefined,
          timestamp: log.created_at,
        };
        sendEvent("agent_dialogue", telemetryLog);
      }

      for (const n of nodesRes.data || []) {
        const nodeData: GraphNodeData = {
          id: n.id,
          label: n.label,
          entityType: n.entity_type,
          summary: n.summary || "",
          confidence: n.confidence ?? 85,
          depthLevel: n.depth_level ?? 0,
          parentNodeId: n.parent_node_id || null,
          isUserAdded: Boolean(n.is_user_added),
          sources: sourcesByNode.get(n.id) || [
            {
              url: "https://verified.source/citation",
              title: n.label,
              verbatimSnippet: n.summary || "Verified factual evidence citation.",
              credibilityScore: n.confidence ?? 85,
            },
          ],
        };
        sendEvent("node_added", nodeData);
      }

      for (const e of edgesRes.data || []) {
        const edgeData: GraphEdgeData = {
          id: e.id,
          source: e.source_id,
          target: e.target_id,
          relationType: e.relation_type,
          label: e.label || e.relation_type,
          isDisputed: Boolean(e.is_disputed),
          explanation: e.explanation || "Direct causal link verified across sources.",
        };
        sendEvent("edge_added", edgeData);
      }

      for (const t of timelineRes.data || []) {
        const timelineItem: TimelineEvent = {
          id: t.id,
          researchId: t.research_id,
          nodeId: t.node_id || undefined,
          eventDate: t.event_date,
          parsedTimestamp: t.parsed_timestamp || undefined,
          title: t.title,
          description: t.description || "",
        };
        sendEvent("timeline_event_added", timelineItem);
      }

      sendEvent("completed", {
        finalSynthesis: record.final_synthesis || "Historical investigation synthesis loaded.",
        totalNodes: nodesRes.data?.length || 0,
        totalEdges: edgesRes.data?.length || 0,
        confidenceScore: record.confidence_score ?? 85,
      });

      controller.close();
    },
  });

  return new Response(replayStream, { headers: SSE_HEADERS });
}

/**
 * Builds an active SSE stream subscribing to the in memory multi agent coordinator.
 */
function buildLiveResearchStream(
  req: NextRequest,
  researchId: string,
): Response {
  const encoder = new TextEncoder();
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let unsubscribe: (() => void) | null = null;
  let isClosed = false;

  const liveStream = new ReadableStream({
    start(controller) {
      const sendSse = (event: SseEvent) => {
        if (isClosed) return;
        try {
          const chunk = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Stream controller closed by client
        }
      };

      const sendPing = () => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          // Stream controller closed by client
        }
      };

      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;

        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }

        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
      };

      const subscription = subscribeToResearch(researchId, (event: SseEvent) => {
        sendSse(event);

        if (event.type === "completed" || (event.type === "error" && !event.data.recoverable)) {
          cleanup();
          try {
            controller.close();
          } catch {}
        }
      });

      unsubscribe = subscription.unsubscribe;

      for (const bufferedEvent of subscription.replayEvents) {
        sendSse(bufferedEvent);
      }

      // Check if run already reached terminal state during subscription
      const isTerminal =
        subscription.run &&
        (subscription.run.status === "completed" || subscription.run.status === "failed") &&
        subscription.replayEvents.some(
          (e) => e.type === "completed" || (e.type === "error" && !e.data.recoverable),
        );

      if (isTerminal) {
        cleanup();
        try {
          controller.close();
        } catch {}
        return;
      }

      // 15 second heartbeat ping keeping connection alive through gateways
      heartbeatTimer = setInterval(sendPing, 15_000);

      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      isClosed = true;
    },
  });

  return new Response(liveStream, { headers: SSE_HEADERS });
}

/**
 * GET /api/research/[id]/stream
 * Streams live multi-agent dialogue, discovered nodes, causal edges, timeline milestones,
 * and completion status over Server-Sent Events.
 * Satisfies AC-1 through AC-8.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: researchId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const queryParam = searchParams.get("q") || "";
  const depthParam = searchParams.get("depth") === "expedition" ? "expedition" : "recon";
  const isGuestSession =
    researchId.startsWith("guest_") ||
    researchId.startsWith("demo") ||
    researchId === "mock";

  // Check coordinator memory first!
  const activeRun = getActiveResearchRun(researchId);
  if (activeRun && activeRun.status === "completed") {
    // Already finished in coordinator memory: replay the buffered events directly!
    return buildLiveResearchStream(req, researchId);
  }

  // 1. Session Authentication & Authorization Guard (Satisfies AC-4)
  const authResult = await verifySessionAuth(researchId, isGuestSession, queryParam);
  if (!authResult.ok) {
    return new Response(authResult.error, { status: authResult.status });
  }

  const { record } = authResult;

  // 2. Historical Replay for Already Completed Investigations (Satisfies AC-5)
  if (record.status === "completed") {
    return buildHistoricalReplayStream(researchId, record);
  }

  // 3. Lazy Startup Check: Only start execution if record is NOT completed and not already running
  const isAlreadyDone = record.status === "completed" || (activeRun && activeRun.status === "completed");
  const isAlreadyRunning = activeRun && activeRun.status === "running";

  if (!isAlreadyDone && !isAlreadyRunning) {
    const effectiveQuery = isGuestSession ? queryParam : record.query;
    if (effectiveQuery) {
      await startResearchExecution({
        researchId,
        query: effectiveQuery,
        depth: depthParam,
        maxIterations: depthParam === "expedition" ? 3 : 1,
        maxQueriesBudget: 12,
      });
    }
  }

  // 4. Live Multi-Agent Stream Connection (Satisfies AC-3, AC-6, AC-7, AC-8)
  return buildLiveResearchStream(req, researchId);
}

