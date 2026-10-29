import { generateText } from "ai";
import {
  type ArchitectPlanInput,
  type ArchitectPlanOutput,
  type CausalGapTarget,
  architectPlanOutputSchema,
  architectPlanInputSchema,
} from "@/types/architect";
import { executeWithLlmFallback } from "@/lib/llm-provider";
import { detectCausalGaps } from "@/lib/agent/gap-detector";
import { evaluateEnigmaCap } from "@/lib/agent/pathway-tracker";

const SYSTEM_PROMPT = `You are "The Architect", the analytical supervisor in an autonomous deep-research intelligence system.
Your job is to reverse-engineer causal historical reality using BACKWARD CAUSAL TRACING.

CORE RULES:
1. REASON BACKWARD IN TIME:
   - Do NOT ask superficial forward-looking questions that simply gather recent news.
   - Start from the outcome and ask: "Why did this happen? What was the direct historical antecedent? What catalyst, technological origin, or prior legal decision initiated this?"

2. TARGET INTERMEDIATE CAUSAL GAPS:
   - Formulate precision search queries that target missing links between unconnected or temporally distant milestones.
   - Each query must have a clear temporal anchor (e.g. "Prior to 2018", "Foundational patent filing era").

3. STRICT LIMIT & FORMAT:
   - Output EXACTLY 2 backward causal sub-queries per planning cycle.
   - You MUST respond with ONLY valid JSON matching this exact structure:
{
  "reasoningSteps": ["string", "string"],
  "detectedGaps": [{ "gapId": "string", "fromNodeId": "string", "toNodeId": "string", "description": "string", "temporalWindow": "string" }],
  "subQueries": [
    {
      "id": "query_1",
      "query": "search keywords",
      "targetGap": { "gapId": "string", "description": "string" },
      "temporalAnchor": "time window",
      "hypothesisRationale": "why this bridges the gap",
      "pathwayBranchId": "branch_1",
      "isDivergentProbe": false
    }
  ],
  "isInvestigationComplete": false,
  "completionReason": "in_progress"
}`;

/**
 * Builds deterministic fallback sub-queries when LLM calls are unavailable, aborted, or rate-limited.
 */
function buildFallbackPlan(
  userQuery: string,
  detectedGaps: CausalGapTarget[],
  reasoningNote: string,
): ArchitectPlanOutput {
  const topGaps = detectedGaps.slice(0, 2);
  const subQueries = topGaps.map((gap, index) => {
    const isGenesis = gap.gapId.startsWith("genesis");
    const query = isGenesis
      ? `${userQuery} founding origins early history catalyst prior antecedents`
      : `${userQuery} ${gap.description} historical cause evidence`;

    return {
      id: `query_${gap.gapId}_${index + 1}`,
      query: query.slice(0, 180),
      targetGap: gap,
      temporalAnchor: gap.temporalWindow || "Historical antecedents",
      hypothesisRationale: `Investigating foundational antecedents for gap: ${gap.description}`,
      pathwayBranchId: `branch_${gap.gapId}_${Date.now()}`,
      isDivergentProbe: false,
    };
  });

  return {
    reasoningSteps: [
      reasoningNote,
      `Identified ${detectedGaps.length} topological causal gaps in graph state.`,
      `Formulated ${subQueries.length} precision backward queries targeting historical precursors.`,
    ],
    detectedGaps,
    subQueries,
    isInvestigationComplete: false,
    completionReason: "in_progress",
  };
}

/**
 * Checks if a complete, unbroken causal chain exists from an identified genesis node to the target outcome.
 */
function isUnbrokenCausalChainPresent(
  nodes: ArchitectPlanInput["nodes"] = [],
  edges: ArchitectPlanInput["edges"] = [],
): boolean {
  const safeNodes = nodes || [];
  const safeEdges = edges || [];

  if (safeNodes.length < 3 || safeEdges.length < 2) {
    return false;
  }

  const incomingCounts = new Map<string, number>();
  const outgoingCounts = new Map<string, number>();

  for (const node of safeNodes) {
    incomingCounts.set(node.id, 0);
    outgoingCounts.set(node.id, 0);
  }

  for (const edge of safeEdges) {
    if (edge.isDisputed) continue;
    incomingCounts.set(edge.target, (incomingCounts.get(edge.target) || 0) + 1);
    outgoingCounts.set(edge.source, (outgoingCounts.get(edge.source) || 0) + 1);
  }

  const genesisNodes = safeNodes.filter((n) => (incomingCounts.get(n.id) || 0) === 0);
  const terminalNodes = safeNodes.filter((n) => (outgoingCounts.get(n.id) || 0) === 0);

  if (genesisNodes.length === 0 || terminalNodes.length === 0) {
    return false;
  }

  const adjacency = new Map<string, string[]>();
  for (const edge of safeEdges) {
    if (edge.isDisputed) continue;
    const list = adjacency.get(edge.source) || [];
    list.push(edge.target);
    adjacency.set(edge.source, list);
  }

  for (const genesis of genesisNodes) {
    const visited = new Set<string>();
    const queue = [genesis.id];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      if (terminalNodes.some((t) => t.id === current && t.id !== genesis.id)) {
        return true;
      }

      const neighbors = adjacency.get(current) || [];
      for (const n of neighbors) {
        if (!visited.has(n)) {
          queue.push(n);
        }
      }
    }
  }

  return false;
}

/**
 * The Architect Supervisor Agent Execution Engine
 * Evaluates graph topology, enforces 4-divergence enigma capping,
 * and formulates 2 backward causal queries via free multi-provider LLMs.
 */
export async function planInvestigationStep(
  input: ArchitectPlanInput,
  options?: { signal?: AbortSignal },
): Promise<ArchitectPlanOutput> {
  // 1. Validate Input Options
  const validatedInput = architectPlanInputSchema.parse(input);
  const { userQuery, nodes, edges, ledger, iteration, preferredProvider } = validatedInput;

  // 2. Identify Topological Causal Gaps
  const detectedGaps = detectCausalGaps(userQuery, nodes, edges);

  // 3. Evaluate 4-Divergent Pathway Enigma Cap (Invariant 10)
  // Check detected gaps as well as any recorded gap in the ledger
  const allCandidateGaps: CausalGapTarget[] = [...detectedGaps];
  if (ledger && ledger.gapAttempts) {
    for (const [gapId, attempts] of Object.entries(ledger.gapAttempts)) {
      if (attempts.length >= 4 && !allCandidateGaps.some((g) => g.gapId === gapId)) {
        allCandidateGaps.push({
          gapId,
          description: `Exhausted gap candidate ${gapId}`,
        });
      }
    }
  }

  for (const gap of allCandidateGaps) {
    const enigma = evaluateEnigmaCap(ledger, gap);
    if (enigma) {
      return {
        reasoningSteps: [
          `Causal gap "${gap.gapId}" reached the 4-pathway divergence ceiling without verified resolution.`,
          `Flagging an Unresolved Enigma node for human review: "${enigma.unresolvedQuestion}".`,
          `Halting inquiry cycle to preserve evidence and avoid futile loops.`,
        ],
        detectedGaps,
        subQueries: [],
        enigma,
        isInvestigationComplete: true,
        completionReason: "enigma_reached",
      };
    }
  }

  // 4. Check for Topological Causal Proof Completion (Invariant 3)
  if (isUnbrokenCausalChainPresent(nodes, edges)) {
    return {
      reasoningSteps: [
        `Verified an unbroken, undisputed causal path connecting historical genesis to current outcome.`,
        `Topological causal completeness criteria satisfied. Finalizing investigation graph.`,
      ],
      detectedGaps,
      subQueries: [],
      isInvestigationComplete: true,
      completionReason: "genesis_linked",
    };
  }

  // 5. Check Absolute Recursion Limits
  if (iteration >= 4) {
    return {
      reasoningSteps: [
        `Inquiry reached maximum recursive iteration ceiling (iteration ${iteration}).`,
        `Synthesizing all verified causal branches and historical findings.`,
      ],
      detectedGaps,
      subQueries: [],
      isInvestigationComplete: true,
      completionReason: "budget_exhausted",
    };
  }

  // 6. Merge AbortSignals with 15-Second Deadline
  const timeoutMs = 15000;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  let effectiveSignal: AbortSignal = timeoutSignal;

  if (options?.signal) {
    if (typeof AbortSignal.any === "function") {
      effectiveSignal = AbortSignal.any([timeoutSignal, options.signal]);
    } else {
      const controller = new AbortController();
      const abort = () => controller.abort();
      timeoutSignal.addEventListener("abort", abort, { once: true });
      options.signal.addEventListener("abort", abort, { once: true });
      effectiveSignal = controller.signal;
    }
  }

  if (effectiveSignal.aborted) {
    return buildFallbackPlan(
      userQuery,
      detectedGaps,
      "Operation aborted prior to execution; generating safe fallback plan.",
    );
  }

  // 7. Invoke Multi-Provider Free LLM Execution
  try {
    const serializedNodes = nodes.map((n) => ({
      id: n.id,
      label: n.label,
      entityType: n.entityType,
      summary: n.summary,
    }));

    const serializedEdges = edges.map((e) => ({
      source: e.source,
      target: e.target,
      label: e.label,
      relationType: e.relationType,
      isDisputed: e.isDisputed,
    }));

    const userPrompt = `USER INQUIRY: "${userQuery}"
CURRENT ITERATION: ${iteration} of 3

EXISTING GRAPH NODES (${nodes.length}):
${JSON.stringify(serializedNodes, null, 2)}

EXISTING CAUSAL EDGES (${edges.length}):
${JSON.stringify(serializedEdges, null, 2)}

IDENTIFIED CAUSAL GAPS (${detectedGaps.length}):
${JSON.stringify(detectedGaps, null, 2)}

TASK:
1. Provide 2 to 3 reasoning steps explaining your backward causal analysis.
2. Select the top 1 or 2 most critical gaps to bridge.
3. Formulate strictly 2 backward causal sub-queries targeting earlier historical precursors.
4. Output valid JSON only.`;

    const { result } = await executeWithLlmFallback(
      async (model) => {
        const { text } = await generateText({
          model,
          system: SYSTEM_PROMPT,
          prompt: userPrompt,
          abortSignal: effectiveSignal,
        });

        // Defensively strip markdown code fences and whitespace
        const cleanJson = text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        const rawParsed = JSON.parse(cleanJson);
        const validated = architectPlanOutputSchema.parse(rawParsed);
        return validated;
      },
      { preferredProvider },
    );

    // Enforce strictly 2 sub-queries maximum (AC-1)
    if (result.subQueries.length > 2) {
      result.subQueries = result.subQueries.slice(0, 2);
    }

    return result;
  } catch (error: unknown) {
    console.warn(
      `[Architect Agent] LLM planning failed or timed out: ${String(error)}. Engaging resilient fallback.`,
    );

    return buildFallbackPlan(
      userQuery,
      detectedGaps,
      `Multi-provider LLM planning encountered an issue (${String(error)}); engaged resilient topological fallback.`,
    );
  }
}
