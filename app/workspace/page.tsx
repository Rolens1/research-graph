// 1. External imports
import React from "react";

// 2. Internal imports
import { getInsForgeServerClient } from "@/lib/insforge-server";
import { WorkspaceDashboardView } from "@/components/workspace/WorkspaceDashboardView";
import type { InvestigationItem } from "@/components/workspace/InvestigationCard";

// 3. Type definitions
type ResearchDbRow = {
  id: string;
  query: string;
  status: string;
  confidence_score: number;
  created_at: string;
  nodes?: Array<{ count: number }>;
  sources?: Array<{ count: number }>;
};

// 4. Component (Next.js 16 App Router Server Component)
export default async function WorkspaceHomePage() {
  const insforge = await getInsForgeServerClient();
  const { data: authData } = await insforge.auth.getCurrentUser();

  let researches: InvestigationItem[] = [];

  if (authData?.user) {
    // Single query joining counts of child nodes and sources
    const { data, error } = await insforge.database
      .from("researches")
      .select("id, query, status, confidence_score, created_at, nodes(count), sources(count)")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[app/workspace/page.tsx] Query with joined counts warning:", error.message);
      // Fallback query if relation count syntax varies
      const fallback = await insforge.database
        .from("researches")
        .select("id, query, status, confidence_score, created_at")
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false });

      if (fallback.data) {
        const rows = fallback.data as unknown as ResearchDbRow[];
        researches = rows.map((item) => ({
          id: item.id,
          query: item.query,
          status: item.status,
          confidence_score: item.confidence_score,
          created_at: item.created_at,
          nodes_count: 0,
          sources_count: 0,
        }));
      }
    } else if (data) {
      const rows = data as unknown as ResearchDbRow[];
      researches = rows.map((item) => ({
        id: item.id,
        query: item.query,
        status: item.status,
        confidence_score: item.confidence_score,
        created_at: item.created_at,
        nodes_count: Array.isArray(item.nodes) && item.nodes[0] ? item.nodes[0].count : 0,
        sources_count: Array.isArray(item.sources) && item.sources[0] ? item.sources[0].count : 0,
      }));
    }
  }

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto">
      <WorkspaceDashboardView
        initialResearches={researches}
        userEmail={authData?.user?.email}
      />
    </div>
  );
}
