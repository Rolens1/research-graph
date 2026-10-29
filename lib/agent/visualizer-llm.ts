import { generateText } from "ai";
import { executeWithLlmFallback } from "@/lib/llm-provider";
import {
  modelVisualizerOutputSchema,
  type ModelVisualizerOutput,
} from "@/types/visualizer";
import type {
  VerifiedEntity,
  VerifiedCausalRelation,
} from "@/types/fact-checker";

const VISUALIZER_SYSTEM_PROMPT = `YOU ARE THE VISUALIZER AGENT IN AN AUTONOMOUS INVESTIGATION SYSTEM.
YOUR ROLE IS TO EVALUATE RESEARCH EVIDENCE AND CLASSIFY THE TOPOLOGY FOR INTERACTIVE GRAPH VISUALIZATION.

FOR EACH ENTITY:
1. impactLevel:
   - "critical": Pivotal inflection points, decisive breakthroughs, core founding events, war declarations, or high magnitude milestones.
   - "high": Major strategic choices, significant technological developments, key institutional actions.
   - "medium": Corroborating developments, standard timeline milestones, supporting actors.
   - "low": Secondary references, background context, isolated mentions.
2. pathwayRole:
   - "core_causal": On the primary unbroken causal chain answering the central user inquiry.
   - "divergent_branch": Side exploration, alternate hypothesis, or rabbit hole lead.
   - "dead_end": Disproven hypothesis, blocked causal pathway, or ruled out claim.

ALSO PROVIDE:
- reasoningSteps: 2 to 3 concise steps explaining your topological assessment.
- sliceSummary: A 2 to 4 sentence executive paragraph summarizing what this graph slice reveals about the inquiry.

RETURN STRICT JSON ONLY MATCHING THIS SCHEMA:
{
  "reasoningSteps": ["step 1", "step 2"],
  "entityClassifications": [
    {
      "entityId": "string matching input entity id",
      "impactLevel": "critical" | "high" | "medium" | "low",
      "pathwayRole": "core_causal" | "divergent_branch" | "dead_end",
      "justification": "short reason"
    }
  ],
  "sliceSummary": "Executive summary paragraph"
}`;

/**
 * Executes the LLM classification pass for impact levels and pathway roles.
 * Satisfies AC-3, AC-4, and AC-8.
 */
export async function executeModelVisualizerPass(
  userQuery: string,
  entities: VerifiedEntity[],
  relations: VerifiedCausalRelation[],
  options?: { preferredProvider?: string; signal?: AbortSignal },
): Promise<{
  result: ModelVisualizerOutput;
  providerId: string;
  modelName: string;
}> {
  const promptPayload = {
    userQuery,
    entities: entities.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.entityType,
      summary: e.summary,
      confidence: e.confidenceScore,
      corroboratingDomains: e.corroboratingDomains,
    })),
    relations: relations.map((r) => ({
      source: r.source,
      target: r.target,
      type: r.relationType,
      label: r.label,
      isDisputed: r.isDisputed,
      explanation: r.explanation,
    })),
  };

  return executeWithLlmFallback(
    async (model) => {
      const { text } = await generateText({
        model,
        system: VISUALIZER_SYSTEM_PROMPT,
        prompt: `CLASSIFY GRAPH VISUAL TOPOLOGY:\n${JSON.stringify(promptPayload, null, 2)}`,
        abortSignal: options?.signal,
      });

      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error("No JSON object detected in visualizer model output");
      }

      const parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1));
      return modelVisualizerOutputSchema.parse(parsed);
    },
    { preferredProvider: options?.preferredProvider, role: "visualizer" },
  );
}
