import {
  visualizerInputSchema,
  visualizerOutputSchema,
  type VisualizerInput,
  type VisualizerOutput,
} from "@/types/visualizer";
import type { GraphNodeData } from "@/types/graph";
import {
  buildEntitySlugRegistry,
  generateEntitySlugId,
  buildSourceCitations,
  mapGranularAmbiguities,
  mapVerifiedRelationsToEdges,
} from "./visualizer-mapping";
import {
  calculateHeuristicImpact,
  assignHeuristicPathwayRoles,
  extractChronologicalTimelineEvents,
  buildEnigmaNode,
} from "./visualizer-heuristics";
import { executeModelVisualizerPass } from "./visualizer-llm";

export class VisualizerExecutionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(`[Visualizer Error] ${message}`);
    this.name = "VisualizerExecutionError";
  }
}

/**
 * Main Visualizer Agent Orchestration Function.
 * Translates verified facts into canonical graph nodes, edges, and timeline milestones.
 * Satisfies AC-1 through AC-8.
 */
export async function executeVisualizer(
  rawInput: VisualizerInput,
  options?: {
    signal?: AbortSignal;
    onThought?: (step: string) => void;
  },
): Promise<VisualizerOutput> {
  const startTime = Date.now();
  const reasoningSteps: string[] = [];

  const logThought = (msg: string) => {
    reasoningSteps.push(msg);
    if (options?.onThought) {
      try {
        options.onThought(msg);
      } catch {
        // Silently ignore telemetry listener errors
      }
    }
  };

  try {
    const input = visualizerInputSchema.parse(rawInput);
    const entityCount = input.verifiedEntities.length;
    const relationCount = input.verifiedRelations.length;

    logThought(
      `[Visualizer] Initiating visual graph synthesis across ${entityCount} verified entities and ${relationCount} causal relations.`,
    );

    // 1. Deterministic Slug Registry and ID Normalization (AC-1)
    const slugRegistry = buildEntitySlugRegistry(input.verifiedEntities, input.existingNodes);
    logThought(`[Visualizer] Constructed collision free slug registry for ${slugRegistry.size} entities.`);

    // 2. Causal Edge Deduplication & Mapping (AC-5)
    const mappedEdges = mapVerifiedRelationsToEdges(
      input.verifiedRelations,
      slugRegistry,
      input.existingEdges,
    );
    logThought(`[Visualizer] Structured ${mappedEdges.length} canonical causal edges with dispute flags preserved.`);

    // 3. Model Classification with Heuristic Fallback (AC-3, AC-4, AC-8)
    const impactMap = new Map<string, "critical" | "high" | "medium" | "low">();
    const roleMap = new Map<string, "core_causal" | "divergent_branch" | "dead_end">();
    let sliceSummary = "";

    const alternateSourceIds = new Set(input.alternateBranches.map((b) => b.sourceEntityId));

    try {
      logThought("[Visualizer] Requesting visual topology classification and executive summary via model pass.");
      const { result, providerId, modelName } = await executeModelVisualizerPass(
        input.userQuery,
        input.verifiedEntities,
        input.verifiedRelations,
        {
          preferredProvider: input.preferredProvider,
          signal: options?.signal,
        },
      );

      for (const thought of result.reasoningSteps) {
        logThought(`[Visualizer LLM - ${providerId}/${modelName}] ${thought}`);
      }

      for (const cls of result.entityClassifications) {
        impactMap.set(cls.entityId, cls.impactLevel);
        roleMap.set(cls.entityId, cls.pathwayRole);
      }

      sliceSummary = result.sliceSummary;
      logThought(`[Visualizer] Applied model classifications for ${result.entityClassifications.length} entities.`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logThought(
        `[Visualizer] Model classification pass unavailable (${errorMsg}). Engaging deterministic heuristic rules.`,
      );

      const heuristicNodes = input.verifiedEntities.map((e) => ({
        id: slugRegistry.get(e.id) || e.id,
        confidence: e.confidenceScore,
        entityType: e.entityType,
        isDisputed: Boolean(e.isContested),
      }));

      const heuristicImpacts = calculateHeuristicImpact(heuristicNodes, mappedEdges);
      for (const [id, impact] of heuristicImpacts) {
        impactMap.set(id, impact);
      }

      const heuristicRoles = assignHeuristicPathwayRoles(heuristicNodes, mappedEdges, alternateSourceIds);
      for (const [id, role] of heuristicRoles) {
        roleMap.set(id, role);
      }

      sliceSummary = `Autonomous investigation structured ${entityCount} entities and ${mappedEdges.length} verified causal links answering: "${input.userQuery}".`;
    }

    // 4. Construct Canonical Graph Nodes (AC-2, AC-3, AC-4)
    const canonicalNodes: GraphNodeData[] = [];

    for (const ent of input.verifiedEntities) {
      const slugId = slugRegistry.get(ent.id) || generateEntitySlugId(ent.name, ent.entityType);
      const impact = impactMap.get(slugId) || impactMap.get(ent.id) || "medium";
      const role = roleMap.get(slugId) || roleMap.get(ent.id) || "core_causal";
      const sources = buildSourceCitations(ent);
      const ambiguities = mapGranularAmbiguities(ent.ambiguities);

      canonicalNodes.push({
        id: slugId,
        label: ent.name.slice(0, 60),
        entityType: ent.entityType,
        summary: ent.summary.slice(0, 300),
        confidence: ent.confidenceScore,
        depthLevel: 0,
        parentNodeId: null,
        isUserAdded: false,
        isDisputed: Boolean(ent.isContested),
        impactLevel: impact,
        timestamp: ent.temporalAnchor || undefined,
        pathwayRole: role,
        ambiguities: ambiguities.length > 0 ? ambiguities : undefined,
        sources,
      });
    }

    // 5. Timeline Event Filtering (AC-6)
    const timelineEvents = extractChronologicalTimelineEvents(canonicalNodes, input.researchId);
    logThought(`[Visualizer] Curated ${timelineEvents.length} chronological milestones for Zone 3 Chrono Timeline.`);

    // 6. Enigma Mystery Synthesis (AC-7)
    const enigmaNodes: GraphNodeData[] = [];
    if (input.isEnigmaTriggered || input.enigmaDeclaration) {
      const enigmaCard = buildEnigmaNode(input.enigmaDeclaration, input.unbridgedGaps[0]);
      enigmaNodes.push(enigmaCard);
      canonicalNodes.push(enigmaCard);
      logThought(`[Visualizer] Instantiated Enigma node "${enigmaCard.id}" representing an unresolved mystery link.`);
    }

    const executionTimeMs = Date.now() - startTime;
    logThought(`[Visualizer] Graph slice synthesis completed in ${executionTimeMs}ms.`);

    const outputPayload: VisualizerOutput = {
      nodes: canonicalNodes,
      edges: mappedEdges,
      timelineEvents,
      enigmaNodes,
      summary: sliceSummary,
      reasoningSteps,
      executionTimeMs,
    };

    return visualizerOutputSchema.parse(outputPayload);
  } catch (err: unknown) {
    if (err instanceof VisualizerExecutionError) throw err;
    throw new VisualizerExecutionError(
      `Visualizer execution cycle failed: ${err instanceof Error ? err.message : String(err)}`,
      err,
    );
  }
}
