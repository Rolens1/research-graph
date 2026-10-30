import { NextRequest, NextResponse } from "next/server";
import { getInsForgeServerClient } from "@/lib/insforge-server";
import { startResearchRequestSchema } from "@/types/actions";
import { startResearchExecution } from "@/lib/agent/stream-coordinator";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/research/start
 * Initializes a new research session and triggers background multi-agent investigation.
 * Satisfies AC-2 and AC-3.
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(req, "start_research");
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit);
    }

    const rawBody = await req.json();
    const parseResult = startResearchRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0]?.message || "Invalid research request parameters.";
      return NextResponse.json({ success: false, error: issue }, { status: 400 });
    }

    const { query, depth = "recon" } = parseResult.data;
    const insforge = await getInsForgeServerClient();
    const { data: authData } = await insforge.auth.getCurrentUser();

    let researchId: string;

    if (authData?.user) {
      const { data, error } = await insforge.database
        .from("researches")
        .insert({
          user_id: authData.user.id,
          query,
          status: "running",
          confidence_score: 0,
        })
        .select("id")
        .single();

      if (error || !data) {
        console.error("[api/research/start] Database creation error:", error);
        return NextResponse.json(
          { success: false, error: error?.message || "Failed to create investigation in database." },
          { status: 500 },
        );
      }

      researchId = data.id;
    } else {
      // Unauthenticated / guest demo voyage identifier
      researchId = "guest_" + Math.random().toString(36).substring(2, 10);
    }

    // Launch multi-agent research loop in the coordinator asynchronously
    await startResearchExecution({
      researchId,
      query,
      depth,
      maxIterations: depth === "expedition" ? 3 : 1,
      maxQueriesBudget: 12,
    });

    return NextResponse.json(
      {
        success: true,
        researchId,
        depth,
        query,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/research/start] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: message || "Failed to launch research session." },
      { status: 500 },
    );
  }
}
