import type { ResearchEngineState } from "@/types/engine";

/**
 * Persists incremental research state into InsForge database tables.
 * Satisfies AC-7.
 */
export async function persistIterationState(
  state: ResearchEngineState,
  options?: { isFinal?: boolean },
): Promise<void> {
  try {
    let getInsForgeServerClient: typeof import("@/lib/insforge-server").getInsForgeServerClient | null = null;
    try {
      const serverMod = await import("@/lib/insforge-server");
      getInsForgeServerClient = serverMod.getInsForgeServerClient;
    } catch {
      // Dynamic import failed (e.g. standalone test environment)
      return;
    }

    if (!getInsForgeServerClient) return;
    const insforge = await getInsForgeServerClient();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(state.researchId);
    if (!isUuid) {
      // Guest or mock string ID is preserved in coordinator memory
      return;
    }

    // 1. Upsert Research Session Record
    try {
      await insforge.database
        .from("researches")
        .upsert(
          {
            id: state.researchId,
            query: state.query,
            status: state.status,
            confidence_score: state.confidenceScore,
            final_synthesis: state.synthesis || null,
            completed_at: options?.isFinal || state.status === "completed" ? new Date().toISOString() : null,
          },
          { onConflict: "id" },
        );
    } catch (err) {
      console.warn(`[Engine Persistence] Failed to upsert research record: ${String(err)}`);
    }

    // 2. Upsert Canonical Graph Nodes
    if (state.nodes.length > 0) {
      const nodeRecords = state.nodes.map((node) => ({
        id: node.id,
        research_id: state.researchId,
        label: node.label,
        entity_type: node.entityType,
        summary: node.summary,
        confidence: node.confidence,
        depth_level: node.depthLevel ?? 0,
        parent_node_id: node.parentNodeId || null,
        is_user_added: Boolean(node.isUserAdded),
      }));

      try {
        await insforge.database
          .from("nodes")
          .upsert(nodeRecords, { onConflict: "id" });
      } catch (err) {
        console.warn(`[Engine Persistence] Failed to upsert nodes: ${String(err)}`);
      }
    }

    // 3. Upsert Causal Graph Edges
    if (state.edges.length > 0) {
      const edgeRecords = state.edges.map((edge) => ({
        research_id: state.researchId,
        source_id: edge.source,
        target_id: edge.target,
        relation_type: edge.relationType,
        label: edge.label || edge.relationType,
        is_disputed: Boolean(edge.isDisputed),
        explanation: edge.explanation || null,
      }));

      try {
        await insforge.database
          .from("edges")
          .upsert(edgeRecords, { onConflict: "research_id,source_id,target_id" });
      } catch (err) {
        console.warn(`[Engine Persistence] Failed to upsert edges: ${String(err)}`);
      }
    }

    // 4. Upsert Chronological Timeline Events
    if (state.timelineEvents.length > 0) {
      const timelineRecords = state.timelineEvents.map((event) => {
        let parsedTime: number | null = null;
        if (event.parsedTimestamp) {
          const directNum = Number(event.parsedTimestamp);
          if (!isNaN(directNum) && directNum > 0) {
            parsedTime = directNum;
          } else {
            const parsedMs = new Date(event.parsedTimestamp).getTime();
            if (!isNaN(parsedMs)) {
              parsedTime = parsedMs;
            }
          }
        }
        return {
          research_id: state.researchId,
          node_id: event.nodeId || null,
          event_date: event.eventDate,
          parsed_timestamp: parsedTime,
          title: event.title,
          description: event.description,
        };
      });

      try {
        await insforge.database
          .from("timeline_events")
          .upsert(timelineRecords, { onConflict: "research_id,node_id,event_date" });
      } catch (err) {
        console.warn(`[Engine Persistence] Failed to upsert timeline events: ${String(err)}`);
      }
    }
  } catch (err: unknown) {
    // Graceful fallback when outside Next.js request context or if InsForge is offline
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[Engine Persistence] Skipped database write (${message}). Local state preserved.`);
  }
}
