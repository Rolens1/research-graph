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
  const initialQuery =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined;
  const initialDepth =
    resolvedSearchParams.depth === "expedition" ? "expedition" : "recon";

  return (
    <WorkspaceClient
      sessionId={sessionId}
      initialQuery={initialQuery}
      initialDepth={initialDepth}
    />
  );
}
