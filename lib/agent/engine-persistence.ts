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
            final_synthesis: state.synthesis,
            completed_at: options?.isFinal ? new Date().toISOString() : null,
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
        impact_level: node.impactLevel,
        pathway_role: node.pathwayRole,
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
        id: edge.id,
        research_id: state.researchId,
        source: edge.source,
        target: edge.target,
        relation_type: edge.relationType,
        label: edge.label,
        is_disputed: Boolean(edge.isDisputed),
      }));

      try {
        await insforge.database
          .from("edges")
          .upsert(edgeRecords, { onConflict: "id" });
      } catch (err) {
        console.warn(`[Engine Persistence] Failed to upsert edges: ${String(err)}`);
      }
    }

    // 4. Upsert Chronological Timeline Events
    if (state.timelineEvents.length > 0) {
      const timelineRecords = state.timelineEvents.map((event) => ({
        id: `${state.researchId}_${event.nodeId}`,
        research_id: state.researchId,
        node_id: event.nodeId,
        event_date: event.eventDate,
        parsed_timestamp: event.parsedTimestamp || null,
        title: event.title,
        description: event.description,
      }));

      try {
        await insforge.database
          .from("timeline_events")
          .upsert(timelineRecords, { onConflict: "id" });
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
