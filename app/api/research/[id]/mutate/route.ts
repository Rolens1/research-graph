import { NextRequest, NextResponse } from "next/server";
import { mutationRequestSchema, type MutationResponse } from "@/types/mutation";
import {
  evaluatePathBreakage,
  verifyAndCreateHypothesisNode,
} from "@/lib/agent/hypothesis-mutation";
import { broadcastToResearch } from "@/lib/agent/stream-coordinator";
import type { GraphNodeData, GraphEdgeData } from "@/types/graph";

async function updateDbNodeExclusion(
  researchId: string,
  nodeId: string,
  isExcluded: boolean,
) {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(researchId);
    if (!isUuid) return;
    const { getInsForgeServerClient } = await import("@/lib/insforge-server");
    const insforge = await getInsForgeServerClient();
    await insforge.database
      .from("nodes")
      .update({ is_excluded: isExcluded })
      .match({ id: nodeId, research_id: researchId });
  } catch (err) {
    console.warn("[MutateRoute] DB exclusion update skipped or failed:", err);
  }
}

async function persistAddedNode(
  researchId: string,
  node: GraphNodeData,
  edges: GraphEdgeData[],
) {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(researchId);
    if (!isUuid) return;
    const { getInsForgeServerClient } = await import("@/lib/insforge-server");
    const insforge = await getInsForgeServerClient();
    await insforge.database.from("nodes").upsert({
      id: node.id,
      research_id: researchId,
      label: node.label,
      entity_type: node.entityType,
      summary: node.summary,
      confidence: node.confidence,
      depth_level: node.depthLevel ?? 1,
      parent_node_id: node.parentNodeId || null,
      is_user_added: true,
      is_excluded: false,
    });
    if (edges.length > 0) {
      await insforge.database.from("edges").upsert(
        edges.map((e) => ({
          research_id: researchId,
          source_id: e.source,
          target_id: e.target,
          relation_type: e.relationType,
          label: e.label,
          explanation: e.explanation,
        })),
      );
    }
  } catch (err) {
    console.warn("[MutateRoute] DB node insert skipped or failed:", err);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: researchId } = await context.params;
    const body = await request.json();
    const parsed = mutationRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid mutation payload", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { action, existingNodes = [], existingEdges = [] } = parsed.data;

    if (action === "exclude_node") {
      const { nodeId } = parsed.data.payload;
      const targetNode = existingNodes.find((n) => n.id === nodeId);
      if (!targetNode && existingNodes.length > 0) {
        return NextResponse.json({ error: `Node ${nodeId} not found` }, { status: 404 });
      }

      const breakage = evaluatePathBreakage(existingNodes, existingEdges, nodeId);

      await updateDbNodeExclusion(researchId, nodeId, true);

      // Broadcast agent dialogue and telemetry thoughts
      breakage.agentThoughts.forEach((thought) => {
        broadcastToResearch(researchId, {
          type: "agent_dialogue",
          data: {
            id: "log_" + Math.random().toString(36).substring(2, 10),
            researchId,
            agentName: "The Fact Checker",
            message: thought,
            actionType: breakage.pathBroken ? "conflict_raised" : "confidence_update",
            timestamp: new Date().toISOString(),
          },
        });
      });

      const response: MutationResponse = {
        success: true,
        action: "exclude_node",
        affectedNodeId: nodeId,
        severedEdgeIds: breakage.severedEdgeIds,
        pathBroken: breakage.pathBroken,
        brokenPathSummary: breakage.summary,
        agentThoughts: breakage.agentThoughts,
        message: `Node "${targetNode?.label || nodeId}" excluded from active causal chain.`,
      };

      return NextResponse.json(response);
    }

    if (action === "restore_node") {
      const { nodeId } = parsed.data.payload;
      const targetNode = existingNodes.find((n) => n.id === nodeId);

      await updateDbNodeExclusion(researchId, nodeId, false);

      const restoreThought = `The Fact Checker: Restored node "${targetNode?.label || nodeId}" to causal chain. Reconnecting severed pathways.`;
      broadcastToResearch(researchId, {
        type: "agent_dialogue",
        data: {
          id: "log_" + Math.random().toString(36).substring(2, 10),
          researchId,
          agentName: "The Fact Checker",
          message: restoreThought,
          actionType: "fact_extracted",
          timestamp: new Date().toISOString(),
        },
      });

      const response: MutationResponse = {
        success: true,
        action: "restore_node",
        affectedNodeId: nodeId,
        severedEdgeIds: [],
        pathBroken: false,
        agentThoughts: [restoreThought],
        message: `Node "${targetNode?.label || nodeId}" restored to active causal chain.`,
      };

      return NextResponse.json(response);
    }

    if (action === "add_node") {
      const payload = parsed.data.payload;

      try {
        const { node, addedEdges, agentThoughts } = await verifyAndCreateHypothesisNode(
          payload,
          existingNodes,
        );

        await persistAddedNode(researchId, node, addedEdges);

        // Broadcast to stream coordinator
        agentThoughts.forEach((thought) => {
          broadcastToResearch(researchId, {
            type: "agent_dialogue",
            data: {
              id: "log_" + Math.random().toString(36).substring(2, 10),
              researchId,
              agentName: "The Reader",
              message: thought,
              actionType: "fact_extracted",
              timestamp: new Date().toISOString(),
            },
          });
        });

        broadcastToResearch(researchId, {
          type: "node_added",
          data: node,
        });

        for (const edge of addedEdges) {
          broadcastToResearch(researchId, {
            type: "edge_added",
            data: edge,
          });
        }

        const response: MutationResponse = {
          success: true,
          action: "add_node",
          affectedNodeId: node.id,
          affectedNode: node,
          addedEdges,
          severedEdgeIds: [],
          pathBroken: false,
          agentThoughts,
          message: `User hypothesis node "${node.label}" added to causal canvas.`,
        };

        return NextResponse.json(response);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Session quota exceeded")) {
          return NextResponse.json({ error: msg }, { status: 400 });
        }
        throw err;
      }
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("[MutateRoute] Unhandled mutation route error:", error);
    return NextResponse.json({ error: "Failed to process hypothesis mutation" }, { status: 500 });
  }
}
