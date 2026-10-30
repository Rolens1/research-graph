import { NextRequest, NextResponse } from "next/server";
import { expandRequestSchema, type ExpandResponse } from "@/types/expansion";
import { executeRabbitHoleExpansion } from "@/lib/agent/rabbit-hole";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = await checkRateLimit(request, "expand_node");
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit);
    }

    const { id: researchId } = await context.params;
    const body = await request.json();
    const parsed = expandRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid expansion payload", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { nodeId, existingNodes = [] } = parsed.data;
    const targetNode = existingNodes.find((n) => n.id === nodeId);

    if (!targetNode && existingNodes.length > 0) {
      return NextResponse.json(
        { error: `Node "${nodeId}" was not found in active graph topology.` },
        { status: 404 },
      );
    }

    if (targetNode && (targetNode.depthLevel ?? 0) >= 3) {
      return NextResponse.json(
        { error: "Maximum recursion depth reached (Depth 3). Cannot expand this lead further." },
        { status: 400 },
      );
    }

    const response: ExpandResponse = await executeRabbitHoleExpansion(researchId, parsed.data);
    return NextResponse.json(response);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to execute rabbit hole expansion";
    console.error("[ExpandRoute] Unhandled expansion error:", error);
    if (msg.includes("Max recursion depth") || msg.includes("not found")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
