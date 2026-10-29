// Mock Investigation Fixture grounded in Zod schemas from context/schemas-and-contracts.md

export type EntityType = "actor" | "event" | "technology" | "decision" | "dispute";
export type RelationType = "causes" | "blocks" | "finances" | "contradicts" | "leads_to";
export type AgentName = "The Architect" | "The Reader" | "The Fact Checker" | "The Visualizer";
export type TelemetryActionType =
  | "search_dispatched"
  | "source_scraped"
  | "fact_extracted"
  | "conflict_raised"
  | "node_spawned"
  | "confidence_update"
  | "goal_reached";

export type MockSourceCitation = {
  id: string;
  url: string;
  title: string;
  publishedDate?: string;
  verbatimSnippet: string;
  credibilityScore: number;
};

export type MockGraphNode = {
  id: string;
  label: string;
  entityType: EntityType;
  summary: string;
  confidence: number;
  depthLevel: number;
  parentNodeId: string | null;
  isUserAdded: boolean;
  isDisputed?: boolean;
  impactLevel?: "critical" | "high" | "medium" | "low";
  timestamp?: string;
  backdropUrl?: string;
  sources: MockSourceCitation[];
};

export type MockGraphEdge = {
  id: string;
  source: string;
  target: string;
  relationType: RelationType;
  label: string;
  isDisputed: boolean;
  explanation: string;
};

export type MockTimelineEvent = {
  id: string;
  researchId: string;
  nodeId?: string;
  eventDate: string;
  parsedTimestamp: string;
  title: string;
  description: string;
  sourceUrl?: string;
};

export type MockTelemetryLog = {
  id: string;
  researchId: string;
  agentName: AgentName;
  message: string;
  actionType: TelemetryActionType;
  timestamp: string;
  payload?: Record<string, unknown>;
};

export type MockInvestigationDataset = {
  id: string;
  query: string;
  depth: "recon" | "expedition";
  status: "running" | "completed" | "failed";
  confidenceScore: number;
  createdAt: string;
  nodes: MockGraphNode[];
  edges: MockGraphEdge[];
  timeline: MockTimelineEvent[];
  telemetry: MockTelemetryLog[];
};

export const MOCK_INVESTIGATION: MockInvestigationDataset = {
  id: "inv_red-sea-maritime-chokepoints-2024",
  query: "Global Supply Chain Disruptions: Red Sea Maritime Chokepoints",
  depth: "expedition",
  status: "completed",
  confidenceScore: 88,
  createdAt: "2026-10-28T08:15:00.000Z",
  nodes: [
    {
      id: "actor_houthi-ansarallah",
      label: "Ansar Allah (Houthi Forces)",
      entityType: "actor",
      summary: "Yemeni militant administration controlling Sanaa and coastal missile installations along Bab el-Mandeb strait.",
      confidence: 94,
      depthLevel: 0,
      parentNodeId: null,
      isUserAdded: false,
      impactLevel: "high",
      timestamp: "08:42",
      backdropUrl: "/backdrops/red_sea_chokepoint.jpg",
      sources: [
        {
          id: "src-1",
          url: "https://www.reuters.com/world/middle-east/red-sea-crisis",
          title: "Reuters: Bab el-Mandeb Chokepoint Attacks",
          publishedDate: "2024-01-15",
          verbatimSnippet: "Ansar Allah launched ballistic anti-ship missiles targeting commercial vessels passing the 20-mile-wide strait.",
          credibilityScore: 92,
        },
      ],
    },
    {
      id: "decision_bab-el-mandeb-blockade",
      label: "Maritime Passage Interdiction",
      entityType: "decision",
      summary: "Unilateral operational campaign targeting container carriers and oil tankers in the southern Red Sea corridor.",
      confidence: 91,
      depthLevel: 0,
      parentNodeId: null,
      isUserAdded: false,
      impactLevel: "critical",
      timestamp: "09:18",
      backdropUrl: "/backdrops/red_sea_chokepoint.jpg",
      sources: [
        {
          id: "src-2",
          url: "https://www.ft.com/content/red-sea-shipping-corridor",
          title: "Financial Times: Global Freight Re-routing",
          publishedDate: "2024-02-02",
          verbatimSnippet: "Over 80% of container traffic normally transiting Suez has been diverted around the southern tip of Africa.",
          credibilityScore: 90,
        },
      ],
    },
    {
      id: "event_cape-good-hope-rerouting",
      label: "Cape of Good Hope Diversion",
      entityType: "event",
      summary: "Commercial shipping fleet detours around South Africa, adding 10 to 14 sailing days and 3,500 nautical miles per voyage.",
      confidence: 89,
      depthLevel: 0,
      parentNodeId: null,
      isUserAdded: false,
      impactLevel: "high",
      timestamp: "10:06",
      backdropUrl: "/backdrops/cape_route_reroute.jpg",
      sources: [
        {
          id: "src-3",
          url: "https://www.wsj.com/world/cape-route-maritime-impact",
          title: "Wall Street Journal: The Cape Route Pivot",
          publishedDate: "2024-02-18",
          verbatimSnippet: "Vessel turnaround times extended by nearly two weeks, creating systemic container imbalances at European ports.",
          credibilityScore: 88,
        },
      ],
    },
    {
      id: "technology_ais-transponder-spoofing",
      label: "AIS Transponder Cloaking & Spoofing",
      entityType: "technology",
      summary: "Commercial and naval electronic countermeasure techniques used to mask vessel positioning and nationality declarations.",
      confidence: 82,
      depthLevel: 1,
      parentNodeId: "decision_bab-el-mandeb-blockade",
      isUserAdded: false,
      impactLevel: "medium",
      timestamp: "10:44",
      backdropUrl: "/backdrops/naval_escort_defense.jpg",
      sources: [
        {
          id: "src-4",
          url: "https://www.lloydslist.com/ais-data-manipulation-red-sea",
          title: "Lloyd's List: Transponder Spoofing Surge",
          publishedDate: "2024-03-01",
          verbatimSnippet: "Vessels broadcasted 'All Crew Chinese' or shut off AIS transponders to evade infrared and radar tracking.",
          credibilityScore: 85,
        },
      ],
    },
    {
      id: "dispute_insurance-war-risk-premiums",
      label: "War Risk Insurance Rate Spikes",
      entityType: "dispute",
      summary: "Underwriters raised hull insurance premiums from 0.1% to over 1.0% of vessel value, creating friction between charterers and shipowners.",
      confidence: 86,
      depthLevel: 0,
      parentNodeId: null,
      isUserAdded: false,
      isDisputed: true,
      impactLevel: "high",
      timestamp: "11:30",
      backdropUrl: "/backdrops/cape_route_reroute.jpg",
      sources: [
        {
          id: "src-5",
          url: "https://www.bloomberg.com/news/marine-insurance-rates-soar",
          title: "Bloomberg: London Underwriters Re-rate Gulf of Aden",
          publishedDate: "2024-02-10",
          verbatimSnippet: "War risk surcharges climbed tenfold, prompting dispute over whether transit costs exceed fuel expenditure via the Cape.",
          credibilityScore: 87,
        },
      ],
    },
    {
      id: "decision_operation-prosperity-guardian",
      label: "Operation Prosperity Guardian",
      entityType: "decision",
      summary: "Multinational maritime security coalition deployed to provide defensive escort convoys and intercept drone swarms.",
      confidence: 92,
      depthLevel: 0,
      parentNodeId: null,
      isUserAdded: false,
      impactLevel: "high",
      timestamp: "12:04",
      backdropUrl: "/backdrops/naval_escort_defense.jpg",
      sources: [
        {
          id: "src-6",
          url: "https://www.defense.gov/News/Releases/prosperity-guardian",
          title: "US Department of Defense: Joint Coalition Overview",
          publishedDate: "2023-12-18",
          verbatimSnippet: "A defensive coalition uniting 20 nations to ensure freedom of navigation and air defense in the Red Sea.",
          credibilityScore: 94,
        },
      ],
    },
  ],
  edges: [
    {
      id: "actor_houthi-ansarallah->decision_bab-el-mandeb-blockade",
      source: "actor_houthi-ansarallah",
      target: "decision_bab-el-mandeb-blockade",
      relationType: "causes",
      label: "deploys anti-ship strikes",
      isDisputed: false,
      explanation: "Direct military orders initiating drone and missile harassment on commercial maritime traffic.",
    },
    {
      id: "decision_bab-el-mandeb-blockade->event_cape-good-hope-rerouting",
      source: "decision_bab-el-mandeb-blockade",
      target: "event_cape-good-hope-rerouting",
      relationType: "causes",
      label: "forces 14-day detour",
      isDisputed: false,
      explanation: "Security risk forces major shipping lines (Maersk, MSC, Hapag-Lloyd) to abandon the Suez route.",
    },
    {
      id: "technology_ais-transponder-spoofing->decision_bab-el-mandeb-blockade",
      source: "technology_ais-transponder-spoofing",
      target: "decision_bab-el-mandeb-blockade",
      relationType: "blocks",
      label: "evades visual targeting",
      isDisputed: false,
      explanation: "Disabling or spoofing automatic identification systems prevents targeting correlation.",
    },
    {
      id: "event_cape-good-hope-rerouting->dispute_insurance-war-risk-premiums",
      source: "event_cape-good-hope-rerouting",
      target: "dispute_insurance-war-risk-premiums",
      relationType: "leads_to",
      label: "spurs premium negotiations",
      isDisputed: true,
      explanation: "Contested debate over whether route diversion costs are lower than war-risk surcharges plus transit tolls.",
    },
    {
      id: "decision_operation-prosperity-guardian->decision_bab-el-mandeb-blockade",
      source: "decision_operation-prosperity-guardian",
      target: "decision_bab-el-mandeb-blockade",
      relationType: "blocks",
      label: "intercepts aerial drones",
      isDisputed: false,
      explanation: "Naval destroyers establish missile defense umbrellas to neutralize incoming loitering munitions.",
    },
  ],
  timeline: [
    {
      id: "evt-1",
      researchId: "inv_red-sea-maritime-chokepoints-2024",
      nodeId: "actor_houthi-ansarallah",
      eventDate: "Nov 19, 2023",
      parsedTimestamp: "2023-11-19T10:00:00.000Z",
      title: "Seizure of Galaxy Leader",
      description: "Heliborne commandos hijack vehicle carrier in southern Red Sea, signaling start of maritime interdiction.",
      sourceUrl: "https://www.reuters.com",
    },
    {
      id: "evt-2",
      researchId: "inv_red-sea-maritime-chokepoints-2024",
      nodeId: "decision_operation-prosperity-guardian",
      eventDate: "Dec 18, 2023",
      parsedTimestamp: "2023-12-18T14:30:00.000Z",
      title: "Operation Prosperity Guardian Announced",
      description: "US and allied defense chiefs form task force to patrol Bab el-Mandeb and Gulf of Aden.",
      sourceUrl: "https://www.defense.gov",
    },
    {
      id: "evt-3",
      researchId: "inv_red-sea-maritime-chokepoints-2024",
      nodeId: "event_cape-good-hope-rerouting",
      eventDate: "Jan 15, 2024",
      parsedTimestamp: "2024-01-15T08:00:00.000Z",
      title: "Mass Container Fleet Diverts via Cape",
      description: "Over 85 percent of scheduled vessels alter course south around Africa, impacting European supply chains.",
      sourceUrl: "https://www.wsj.com",
    },
    {
      id: "evt-4",
      researchId: "inv_red-sea-maritime-chokepoints-2024",
      nodeId: "dispute_insurance-war-risk-premiums",
      eventDate: "Feb 08, 2024",
      parsedTimestamp: "2024-02-08T16:00:00.000Z",
      title: "London Joint War Committee Re-rates Corridor",
      description: "Insurance underwriters expand designated high-risk area, pushing war risk rates past 1.0 percent.",
      sourceUrl: "https://www.bloomberg.com",
    },
  ],
  telemetry: [
    {
      id: "log-1",
      researchId: "inv_red-sea-maritime-chokepoints-2024",
      agentName: "The Architect",
      message: "Decomposed inquiry into 3 causal trajectories: Coastal Missile Installations, Cape Route Detour, and Naval Counter-Measures.",
      actionType: "search_dispatched",
      timestamp: "2026-10-28T08:15:10.000Z",
    },
    {
      id: "log-2",
      researchId: "inv_red-sea-maritime-chokepoints-2024",
      agentName: "The Reader",
      message: "Extracted 6 primary sources across Reuters, Lloyd's List, and Department of Defense briefs.",
      actionType: "source_scraped",
      timestamp: "2026-10-28T08:15:25.000Z",
    },
    {
      id: "log-3",
      researchId: "inv_red-sea-maritime-chokepoints-2024",
      agentName: "The Fact Checker",
      message: "Cross-verified 10-14 day delay metric. Consensus reached across 4 independent carrier bulletins.",
      actionType: "fact_extracted",
      timestamp: "2026-10-28T08:15:40.000Z",
    },
    {
      id: "log-4",
      researchId: "inv_red-sea-maritime-chokepoints-2024",
      agentName: "The Fact Checker",
      message: "Flagged economic dispute: Hull war risk premiums versus bunker fuel savings on Cape detour.",
      actionType: "conflict_raised",
      timestamp: "2026-10-28T08:15:52.000Z",
    },
    {
      id: "log-5",
      researchId: "inv_red-sea-maritime-chokepoints-2024",
      agentName: "The Visualizer",
      message: "Structured 6 causal entities and 5 directed edges. Applied deterministic layered left-to-right alignment.",
      actionType: "node_spawned",
      timestamp: "2026-10-28T08:16:05.000Z",
    },
    {
      id: "log-6",
      researchId: "inv_red-sea-maritime-chokepoints-2024",
      agentName: "The Architect",
      message: "Confidence reached 88%. Met stopping threshold (>=85%). Finalizing causal chart synthesis.",
      actionType: "confidence_update",
      timestamp: "2026-10-28T08:16:15.000Z",
    },
  ],
};
