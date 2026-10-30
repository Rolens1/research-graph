// 1. External imports (none)

// 2. Internal imports
import { WorkspaceClient } from "./WorkspaceClient";

// 3. Type definitions
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// 4. Component (Next.js 16 App Router Server Component)
export default async function WorkspacePage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const sessionId = resolvedParams.id;
  let initialQuery =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined;
  const initialDepth =
    resolvedSearchParams.depth === "expedition" ? "expedition" : "recon";

  if (!initialQuery) {
    try {
      const { getActiveResearchRun } = await import("@/lib/agent/stream-coordinator");
      const active = getActiveResearchRun(sessionId);
      if (active?.query) {
        initialQuery = active.query;
      } else {
        const { getInsForgeServerClient } = await import("@/lib/insforge-server");
        const insforge = await getInsForgeServerClient();
        const { data } = await insforge.database
          .from("researches")
          .select("query")
          .eq("id", sessionId)
          .single();
        if (data?.query) {
          initialQuery = data.query;
        }
      }
    } catch {
      // Fallback to client state
    }
  }

  return (
    <WorkspaceClient
      sessionId={sessionId}
      initialQuery={initialQuery}
      initialDepth={initialDepth}
    />
  );
}
