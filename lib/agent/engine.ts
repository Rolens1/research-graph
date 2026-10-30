import {
  researchEngineOptionsSchema,
  type ResearchEngineOptions,
  type ResearchEngineState,
  type ResearchStreamEvent,
} from "@/types/engine";
import { planInvestigationStep } from "./architect";
import { executeReaderInvestigation } from "./reader";
import { executeFactCheck } from "./fact-checker";
import { executeVisualizer } from "./visualizer";
import {
  evaluateTerminationCondition,
  generateExecutiveSynthesis,
} from "./engine-invariants";
import { persistIterationState } from "./engine-persistence";
import { extractGraphDelta, createAgentThought } from "./engine-steps";

/**
 * Master Autonomous Multi-Agent Research Engine.
 * Implements the recursive 4-agent investigation loop yielding live stream events.
 * Satisfies AC-1 through AC-8.
 */
export async function* runMasterResearchLoop(
  rawOptions: ResearchEngineOptions,
): AsyncGenerator<ResearchStreamEvent, ResearchEngineState, unknown> {
  const startTime = Date.now();
  const options = researchEngineOptionsSchema.parse(rawOptions);

  const state: ResearchEngineState = {
    researchId: options.researchId,
    query: options.query,
    iteration: 0,
    confidenceScore: 0,
    totalQueriesExecuted: 0,
    nodes: [],
    edges: [],
    timelineEvents: [],
    unbridgedGaps: [],
    pathwayLedger: { gapAttempts: {} },
    synthesis: "",
    status: "running",
  };

  yield createAgentThought("Architect", `Initiating autonomous investigation into "${options.query}" (${options.depth} mode).`);

  while (state.status === "running") {
    state.iteration += 1;

    if (rawOptions.signal?.aborted) {
      state.status = "failed";
      state.completionReason = "Investigation aborted by user.";
      yield { type: "research_error", error: "Investigation aborted prior to completion.", isFatal: true };
      break;
    }

    try {
      // 1. Planning: The Architect
      yield createAgentThought("Architect", `Cycle ${state.iteration}: Analyzing topology for backward causal queries.`);
      const plan = await planInvestigationStep(
        {
          userQuery: state.query,
          nodes: state.nodes,
          edges: state.edges,
          ledger: state.pathwayLedger,
          iteration: state.iteration,
          preferredProvider: options.preferredProvider,
        },
        { signal: rawOptions.signal },
      );

      for (const thought of plan.reasoningSteps) {
        yield createAgentThought("Architect", thought);
      }

      state.unbridgedGaps = plan.detectedGaps;
      const subQueriesToSearch = plan.subQueries.slice(0, 3);
      state.totalQueriesExecuted += subQueriesToSearch.length;

      // If the architect declared the investigation complete or produced 0 sub-queries,
      // conclude gracefully without dispatching an empty search pass
      if (plan.isInvestigationComplete || subQueriesToSearch.length === 0) {
        state.status = "completed";
        state.completionReason = plan.completionReason || "Investigation reached topological completeness.";
        yield createAgentThought("Architect", "Causal path verified with no further queries required. Finalizing synthesis.");
        break;
      }

      // 2. Reconnaissance: The Reader
      yield createAgentThought("Reader", `Cycle ${state.iteration}: Sounding sources across ${subQueriesToSearch.length} search queries.`);
      const readerResult = await executeReaderInvestigation(
        {
          subQueries: subQueriesToSearch,
          existingGraphKeywords: state.nodes.map((n) => n.label),
          includeFullContent: false,
          preferredProvider: options.preferredProvider,
        },
        { signal: rawOptions.signal },
      );

      for (const thought of readerResult.reasoningSteps) {
        yield createAgentThought("Reader", thought);
      }

      // 3. Verification: The Fact Checker
      yield createAgentThought("Checker", `Cycle ${state.iteration}: Cross-verifying consensus across ${readerResult.allEntities.length} candidates.`);
      const factCheckResult = await executeFactCheck(
        {
          candidateEntities: readerResult.allEntities,
          extractedFacts: readerResult.allFacts,
          existingKeywords: state.nodes.map((n) => n.label),
          preferredProvider: options.preferredProvider,
        },
        { signal: rawOptions.signal },
      );

      for (const thought of factCheckResult.reasoningSteps) {
        yield createAgentThought("Checker", thought);
      }

      state.confidenceScore = factCheckResult.overallConfidenceScore;
      yield {
        type: "confidence_updated",
        confidenceScore: state.confidenceScore,
        explanation: `Consensus corroboration ratio at ${Math.round(factCheckResult.corroborationRatio * 100)}%.`,
      };

      // 4. Visualization: The Visualizer
      yield createAgentThought("Visualizer", `Cycle ${state.iteration}: Structuring canonical graph slices and milestones.`);
      const visualizerResult = await executeVisualizer(
        {
          researchId: state.researchId,
          userQuery: state.query,
          iteration: state.iteration,
          verifiedEntities: factCheckResult.verifiedEntities,
          verifiedRelations: factCheckResult.verifiedRelations,
          discoveredAmbiguities: factCheckResult.discoveredAmbiguities,
          alternateBranches: factCheckResult.alternateBranches,
          unbridgedGaps: state.unbridgedGaps,
          isEnigmaTriggered: Boolean(plan.enigma),
          enigmaDeclaration: plan.enigma,
          existingNodes: state.nodes,
          existingEdges: state.edges,
          preferredProvider: options.preferredProvider,
        },
        { signal: rawOptions.signal },
      );

      for (const thought of visualizerResult.reasoningSteps) {
        yield createAgentThought("Visualizer", thought);
      }

      // Stream delta graph elements
      const delta = extractGraphDelta(
        visualizerResult.nodes,
        visualizerResult.edges,
        visualizerResult.timelineEvents,
        state.nodes,
        state.edges,
        state.timelineEvents,
      );

      for (const node of delta.newNodes) {
        yield { type: "node_discovered", node };
        state.nodes.push(node);
      }
      for (const edge of delta.newEdges) {
        yield { type: "edge_discovered", edge };
        state.edges.push(edge);
      }
      for (const event of delta.newTimelineEvents) {
        yield { type: "timeline_event", event };
        state.timelineEvents.push(event);
      }

      state.synthesis = visualizerResult.summary;

      // 5. Incremental Persistence
      await persistIterationState(state);

      // 6. Invariant Termination Evaluation
      const decision = evaluateTerminationCondition(state, options, Boolean(plan.enigma));
      if (decision.shouldStop) {
        state.status = decision.status;
        state.completionReason = decision.reason;
        yield createAgentThought("Architect", `Inquiry concluded: ${decision.reason}`);
        break;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      yield createAgentThought("Architect", `Encountered step warning (${msg}). Engaging recovery.`);
      if (state.iteration >= (options.maxIterations ?? 1)) {
        state.status = "completed";
        state.completionReason = "Concluded after error recovery.";
        break;
      }
    }
  }

  if (!state.synthesis) {
    state.synthesis = generateExecutiveSynthesis(state);
  }

  await persistIterationState(state, { isFinal: true });

  const executionTimeMs = Date.now() - startTime;
  yield {
    type: "research_completed",
    synthesis: state.synthesis,
    totalNodes: state.nodes.length,
    totalEdges: state.edges.length,
    confidenceScore: state.confidenceScore,
    executionTimeMs,
  };

  return state;
}
