import { generateText } from "ai";
import { z } from "zod";
import type { ExtractedFact } from "@/types/reader";
import type {
  VerifiedEntity,
  VerifiedCausalRelation,
  AlternateCausalBranch,
} from "@/types/fact-checker";
import { executeWithLlmFallback } from "@/lib/llm-provider";
import { extractDomainFromUrl } from "./fact-checker-scoring";

const rawContradictionOutputSchema = z.object({
  relations: z.array(
    z.object({
      sourceId: z.string().optional(),
      source: z.string().optional(),
      targetId: z.string().optional(),
      target: z.string().optional(),
      relationType: z.string().optional().default("causes"),
      label: z.string().optional().default("connected to"),
      confidence: z.number().optional().default(75),
      isDisputed: z.boolean().optional().default(false),
      explanation: z.string().optional().default("Causal relation detected between entities"),
    }),
  ).default([]),
  alternateBranches: z.array(
    z.object({
      branchId: z.string().optional(),
      hypothesisName: z.string().optional(),
      name: z.string().optional(),
      title: z.string().optional(),
      summary: z.string().optional(),
      sourceEntityId: z.string().optional(),
      sourceId: z.string().optional(),
      source: z.string().optional(),
      targetEntityId: z.string().optional(),
      targetId: z.string().optional(),
      target: z.string().optional(),
      relationType: z.string().optional().default("causes"),
      supportingDomains: z.array(z.string()).default([]),
      isDisputed: z.boolean().optional().default(true),
      explanation: z.string().optional(),
    }),
  ).max(2).default([]),
});

const CONTRADICTION_SYSTEM_PROMPT = `You are "The Fact Checker", an elite investigative verification engine.
Analyze verified entities and extracted facts to identify causal connections and direct contradictions.
CRITICAL RULES:
1. Connect source and target entities using verified facts. Valid relationType values: "causes", "blocks", "finances", "contradicts", "leads_to".
2. When sources directly contradict regarding origins or catalysts, flag relation with "isDisputed: true" and synthesize AT MOST 2 alternate branches.
3. Do NOT emit canvas coordinates. Return valid JSON: { "relations": [{ "sourceId": "id", "targetId": "id", "relationType": "causes", "label": "text", "confidence": 85, "isDisputed": false, "explanation": "text" }], "alternateBranches": [{ "branchId": "id", "hypothesisName": "text", "summary": "text", "sourceEntityId": "id", "targetEntityId": "id", "relationType": "causes", "supportingDomains": ["domain"], "isDisputed": true, "explanation": "text" }] }`;

function cleanRelationType(val?: string): "causes" | "blocks" | "finances" | "contradicts" | "leads_to" {
  const lower = (val || "").toLowerCase();
  if (lower === "causes" || lower === "blocks" || lower === "finances" || lower === "contradicts" || lower === "leads_to") return lower;
  return "causes";
}

function evaluateHeuristicContradictions(
  entities: VerifiedEntity[],
  facts: ExtractedFact[],
): { relations: VerifiedCausalRelation[]; alternateBranches: AlternateCausalBranch[] } {
  const relations: VerifiedCausalRelation[] = [];
  const alternateBranches: AlternateCausalBranch[] = [];
  if (entities.length < 2) return { relations, alternateBranches };

  for (const fact of facts) {
    const textLower = fact.statement.toLowerCase();
    const matched = entities.filter((e) =>
      textLower.includes(e.name.toLowerCase()) || fact.entitiesInvolved.some((inv) => inv.toLowerCase() === e.name.toLowerCase()),
    );
    if (matched.length >= 2) {
      const [src, tgt] = matched;
      let relType: VerifiedCausalRelation["relationType"] = "leads_to";
      let isDisputed = false;
      let label = "leads to";

      if (/\b(cause|catalyst|found|create|origin)\b/i.test(textLower)) {
        relType = "causes";
        label = "caused";
      } else if (/\b(block|prevent|stop|halt|tariff|sanction)\b/i.test(textLower)) {
        relType = "blocks";
        label = "blocked";
      } else if (/\b(fund|invest|finance|subsidy)\b/i.test(textLower)) {
        relType = "finances";
        label = "financed";
      } else if (/\b(dispute|contradict|contest|oppose|competing)\b/i.test(textLower)) {
        relType = "contradicts";
        label = "disputes claim";
        isDisputed = true;
      }

      if (!relations.some((r) => r.source === src.id && r.target === tgt.id)) {
        relations.push({
          id: `rel_${src.id}_${tgt.id}_${relations.length}`,
          source: src.id,
          target: tgt.id,
          relationType: relType,
          label,
          confidence: isDisputed ? 55 : Math.min(src.confidenceScore, tgt.confidenceScore),
          isDisputed,
          explanation: fact.statement.slice(0, 380),
          alternateBranches: [],
        });
      }
    }
  }

  const targetMap = new Map<string, VerifiedCausalRelation[]>();
  for (const rel of relations) {
    const list = targetMap.get(rel.target) || [];
    list.push(rel);
    targetMap.set(rel.target, list);
  }

  for (const [tgtId, relList] of targetMap.entries()) {
    if (relList.length >= 2 && alternateBranches.length === 0) {
      const [branchA, branchB] = relList;
      branchA.isDisputed = true;
      branchB.isDisputed = true;

      const alt1: AlternateCausalBranch = {
        branchId: `branch_alpha_${branchA.source}`,
        hypothesisName: `Hypothesis: ${branchA.label}`,
        summary: branchA.explanation.slice(0, 380),
        sourceEntityId: branchA.source,
        targetEntityId: tgtId,
        relationType: branchA.relationType,
        supportingDomains: [extractDomainFromUrl(facts[0]?.sourceUrl || "https://source-a.org")],
        isDisputed: true,
        explanation: branchA.explanation,
      };
      const alt2: AlternateCausalBranch = {
        branchId: `branch_beta_${branchB.source}`,
        hypothesisName: `Hypothesis: ${branchB.label}`,
        summary: branchB.explanation.slice(0, 380),
        sourceEntityId: branchB.source,
        targetEntityId: tgtId,
        relationType: branchB.relationType,
        supportingDomains: [extractDomainFromUrl(facts[1]?.sourceUrl || "https://source-b.org")],
        isDisputed: true,
        explanation: branchB.explanation,
      };
      alternateBranches.push(alt1, alt2);
      branchA.alternateBranches = [alt1, alt2];
    }
  }
  return { relations, alternateBranches: alternateBranches.slice(0, 2) };
}

export async function evaluateCausalContradictions(
  entities: VerifiedEntity[],
  facts: ExtractedFact[],
  options?: { preferredProvider?: string; signal?: AbortSignal },
): Promise<{
  relations: VerifiedCausalRelation[];
  alternateBranches: AlternateCausalBranch[];
  method: "llm" | "heuristic_fallback";
}> {
  if (entities.length < 2) return { relations: [], alternateBranches: [], method: "heuristic_fallback" };

  const promptPayload = {
    entities: entities.map((e) => ({ id: e.id, name: e.name, type: e.entityType, summary: e.summary, domains: e.corroboratingDomains })),
    facts: facts.map((f) => ({
      statement: f.statement,
      domain: f.sourceDomain || extractDomainFromUrl(f.sourceUrl),
      url: f.sourceUrl,
      entitiesInvolved: f.entitiesInvolved,
    })),
  };

  try {
    const { result } = await executeWithLlmFallback(
      async (model) => {
        const { text } = await generateText({
          model,
          system: CONTRADICTION_SYSTEM_PROMPT,
          prompt: `VERIFY CAUSALITY & CONTRADICTIONS:\n${JSON.stringify(promptPayload, null, 2)}`,
          abortSignal: options?.signal,
        });

        const cleanJson = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
        const firstBrace = cleanJson.indexOf("{");
        const lastBrace = cleanJson.lastIndexOf("}");
        if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON object detected in contradiction output");
        const parsed = JSON.parse(cleanJson.slice(firstBrace, lastBrace + 1));
        return rawContradictionOutputSchema.parse(parsed);
      },
      { preferredProvider: options?.preferredProvider, role: "fact_checker" },
    );

    const validEntityIds = new Set(entities.map((e) => e.id));
    const verifiedAlternateBranches: AlternateCausalBranch[] = result.alternateBranches.slice(0, 2).map((b, idx) => {
      const srcId = b.sourceEntityId || b.sourceId || b.source || entities[0].id;
      const tgtId = b.targetEntityId || b.targetId || b.target || entities[1].id;
      const explanation = b.explanation || b.summary || "Alternate causal hypothesis";
      const summary = b.summary || explanation.slice(0, 380);
      return {
        branchId: b.branchId || `branch_${idx + 1}_${srcId}`,
        hypothesisName: b.hypothesisName || b.name || b.title || `Hypothesis ${idx + 1}`,
        summary: summary.length >= 10 ? summary : `${summary} verified branch details`,
        sourceEntityId: validEntityIds.has(srcId) ? srcId : entities[0].id,
        targetEntityId: validEntityIds.has(tgtId) ? tgtId : entities[1].id,
        relationType: cleanRelationType(b.relationType),
        supportingDomains: b.supportingDomains.length > 0 ? b.supportingDomains : [entities[0].corroboratingDomains[0] || "verified.org"],
        isDisputed: true,
        explanation: explanation.length >= 10 ? explanation : `${explanation} verified explanation`,
      };
    });

    const verifiedRelations: VerifiedCausalRelation[] = result.relations
      .map((r, idx) => {
        const srcId = r.sourceId || r.source || "";
        const tgtId = r.targetId || r.target || "";
        if (!validEntityIds.has(srcId) || !validEntityIds.has(tgtId) || srcId === tgtId) return null;
        const explanation = r.explanation || `Causal link between ${srcId} and ${tgtId}`;
        return {
          id: `rel_${srcId}_${tgtId}_${idx}`,
          source: srcId,
          target: tgtId,
          relationType: cleanRelationType(r.relationType),
          label: (r.label || "causes").slice(0, 60),
          confidence: Math.round(r.confidence || 75),
          isDisputed: Boolean(r.isDisputed),
          explanation: explanation.length >= 5 ? explanation.slice(0, 400) : "Causal link detected",
          alternateBranches: r.isDisputed ? verifiedAlternateBranches : [],
        };
      })
      .filter((r): r is VerifiedCausalRelation => r !== null);

    return { relations: verifiedRelations, alternateBranches: verifiedAlternateBranches, method: "llm" };
  } catch (err: unknown) {
    console.warn(`[Fact Checker] Contradiction LLM pass failed, falling back to heuristics: ${String(err)}`);
    const fallback = evaluateHeuristicContradictions(entities, facts);
    return { relations: fallback.relations, alternateBranches: fallback.alternateBranches, method: "heuristic_fallback" };
  }
}
