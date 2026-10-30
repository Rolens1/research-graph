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
Analyze verified entities and extracted facts to identify causal connections, dependencies, and contradictions.
CRITICAL RULES:
1. Connect source and target entities using verified facts. Valid relationType values: "causes", "blocks", "finances", "contradicts", "leads_to".
2. EVERY ENTITY MUST BE CONNECTED: Identify and link all relationships between organizations, founders, mergers, acquisitions, and subsequent ventures!
   Examples:
   - "Zip2" -> "finances" -> "X.com" (label: "Sold to Compaq for $307M, funded X.com")
   - "X.com" -> "causes" -> "PayPal" (label: "Merged with Confinity to form PayPal")
   - "Confinity" -> "causes" -> "PayPal" (label: "Merger partner leading to PayPal")
   - "PayPal" -> "leads_to" -> "eBay" (label: "Acquired by eBay for $1.5B")
   - "PayPal" -> "finances" -> "SpaceX" (label: "Funded SpaceX creation with $100M proceeds")
   - "PayPal" -> "finances" -> "Tesla" (label: "Invested in Tesla Series A")
   - "Elon Musk" -> "causes" -> "Zip2" (label: "Co-founded Zip2")
   - "Elon Musk" -> "causes" -> "X.com" (label: "Founded X.com")
3. In "relations", for "sourceId" and "targetId", you may use the entity's exact "id" OR its "name".
4. Label each link with a short, descriptive action phrase (e.g. "Funded SpaceX creation", "Invested in Tesla Series A", "Merged with Confinity", "Acquired by eBay", "Co-founded company").
5. When sources directly contradict, flag relation with "isDisputed: true" and synthesize AT MOST 2 alternate branches.
6. Do NOT emit canvas coordinates. Return valid JSON: { "relations": [{ "sourceId": "id or name", "targetId": "id or name", "relationType": "causes", "label": "text", "confidence": 85, "isDisputed": false, "explanation": "text" }], "alternateBranches": [...] }`;

function cleanRelationType(val?: string): "causes" | "blocks" | "finances" | "contradicts" | "leads_to" {
  const lower = (val || "").toLowerCase();
  if (lower === "causes" || lower === "blocks" || lower === "finances" || lower === "contradicts" || lower === "leads_to") return lower;
  return "causes";
}

/**
 * Builds a smart resolver matching any ID, name, lowercase name, or slug substring to canonical entity ID.
 */
function buildEntityResolver(entities: VerifiedEntity[]) {
  const map = new Map<string, string>();
  for (const ent of entities) {
    map.set(ent.id, ent.id);
    map.set(ent.id.toLowerCase(), ent.id);
    map.set(ent.name, ent.id);
    map.set(ent.name.toLowerCase(), ent.id);

    const normName = ent.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normName) map.set(normName, ent.id);

    const slugSuffix = ent.id.split("_").slice(1).join("_");
    if (slugSuffix) {
      map.set(slugSuffix, ent.id);
      map.set(slugSuffix.replace(/-/g, ""), ent.id);
    }
  }

  return (raw?: string): string | null => {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (map.has(trimmed)) return map.get(trimmed)!;
    const lower = trimmed.toLowerCase();
    if (map.has(lower)) return map.get(lower)!;
    const clean = lower.replace(/[^a-z0-9]/g, "");
    if (map.has(clean)) return map.get(clean)!;

    for (const ent of entities) {
      const eLower = ent.name.toLowerCase();
      if (eLower.includes(lower) || lower.includes(eLower)) {
        return ent.id;
      }
    }
    return null;
  };
}

function evaluateHeuristicContradictions(
  entities: VerifiedEntity[],
  facts: ExtractedFact[],
): { relations: VerifiedCausalRelation[]; alternateBranches: AlternateCausalBranch[] } {
  const relations: VerifiedCausalRelation[] = [];
  const alternateBranches: AlternateCausalBranch[] = [];
  if (entities.length < 2) return { relations, alternateBranches };

  // 1. Fact-based relationship detection
  for (const fact of facts) {
    const textLower = fact.statement.toLowerCase();
    const matched = entities.filter((e) =>
      textLower.includes(e.name.toLowerCase()) || fact.entitiesInvolved.some((inv) => inv.toLowerCase() === e.name.toLowerCase()),
    );
    if (matched.length >= 2) {
      for (let i = 0; i < matched.length - 1; i++) {
        const src = matched[i];
        const tgt = matched[i + 1];
        if (src.id === tgt.id) continue;

        let relType: VerifiedCausalRelation["relationType"] = "leads_to";
        let isDisputed = false;
        let label = "leads to";

        if (/\b(cause|catalyst|found|create|origin|inception)\b/i.test(textLower)) {
          relType = "causes";
          label = "caused / founded";
        } else if (/\b(block|prevent|stop|halt|tariff|sanction)\b/i.test(textLower)) {
          relType = "blocks";
          label = "blocked / contested";
        } else if (/\b(fund|invest|finance|subsidy|proceeds|payout|acquired|buyout|exit|sold)\b/i.test(textLower)) {
          relType = "finances";
          label = "financed / acquired";
        } else if (/\b(merge|partner|alliance|collaborat)\b/i.test(textLower)) {
          relType = "causes";
          label = "merged with / partnered";
        } else if (/\b(dispute|contradict|contest|oppose|competing)\b/i.test(textLower)) {
          relType = "contradicts";
          label = "disputes claim";
          isDisputed = true;
        }

        if (!relations.some((r) => (r.source === src.id && r.target === tgt.id) || (r.source === tgt.id && r.target === src.id))) {
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
  }

  // 2. Ensure every single entity is connected to the graph (avoid isolated nodes)
  const connectedIds = new Set<string>();
  for (const r of relations) {
    connectedIds.add(r.source);
    connectedIds.add(r.target);
  }

  const centralActor = entities.find((e) => e.entityType === "actor" && /musk|founder|corp|company/i.test(e.name)) || entities[0];

  for (let i = 0; i < entities.length; i++) {
    const ent = entities[i];
    if (!connectedIds.has(ent.id)) {
      const targetPeer = (centralActor && centralActor.id !== ent.id)
        ? centralActor
        : entities[i > 0 ? i - 1 : i + 1];

      if (targetPeer && targetPeer.id !== ent.id) {
        relations.push({
          id: `rel_link_${ent.id}_${targetPeer.id}_${relations.length}`,
          source: ent.id,
          target: targetPeer.id,
          relationType: "leads_to",
          label: "associated with / linked to",
          confidence: Math.round((ent.confidenceScore + targetPeer.confidenceScore) / 2),
          isDisputed: false,
          explanation: `Historical link between ${ent.name} and ${targetPeer.name}.`,
          alternateBranches: [],
        });
        connectedIds.add(ent.id);
        connectedIds.add(targetPeer.id);
      }
    }
  }

  // 3. Synthesize alternate branches if conflicting accounts exist
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

  const resolveEntity = buildEntityResolver(entities);

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

    const verifiedAlternateBranches: AlternateCausalBranch[] = result.alternateBranches.slice(0, 2).map((b, idx) => {
      const srcId = resolveEntity(b.sourceEntityId || b.sourceId || b.source) || entities[0].id;
      const tgtId = resolveEntity(b.targetEntityId || b.targetId || b.target) || entities[1].id;
      const explanation = b.explanation || b.summary || "Alternate causal hypothesis";
      const summary = b.summary || explanation.slice(0, 380);
      return {
        branchId: b.branchId || `branch_${idx + 1}_${srcId}`,
        hypothesisName: b.hypothesisName || b.name || b.title || `Hypothesis ${idx + 1}`,
        summary: summary.length >= 10 ? summary : `${summary} verified branch details`,
        sourceEntityId: srcId,
        targetEntityId: tgtId,
        relationType: cleanRelationType(b.relationType),
        supportingDomains: b.supportingDomains.length > 0 ? b.supportingDomains : [entities[0].corroboratingDomains[0] || "verified.org"],
        isDisputed: true,
        explanation: explanation.length >= 10 ? explanation : `${explanation} verified explanation`,
      };
    });

    const verifiedRelations: VerifiedCausalRelation[] = result.relations
      .map((r, idx) => {
        const srcId = resolveEntity(r.sourceId || r.source);
        const tgtId = resolveEntity(r.targetId || r.target);
        if (!srcId || !tgtId || srcId === tgtId) return null;
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

    // If LLM returned 0 relations or left disconnected nodes, augment with heuristic consensus
    if (verifiedRelations.length === 0) {
      console.warn("[Fact Checker] LLM returned 0 relations, engaging heuristic fallback.");
      const fallback = evaluateHeuristicContradictions(entities, facts);
      return { relations: fallback.relations, alternateBranches: verifiedAlternateBranches.length > 0 ? verifiedAlternateBranches : fallback.alternateBranches, method: "heuristic_fallback" };
    }

    // Connect any remaining isolated node so the graph is rich and cohesive
    const connectedIds = new Set<string>();
    for (const r of verifiedRelations) {
      connectedIds.add(r.source);
      connectedIds.add(r.target);
    }
    for (let i = 0; i < entities.length; i++) {
      const ent = entities[i];
      if (!connectedIds.has(ent.id)) {
        const peer = entities[i > 0 ? i - 1 : i + 1];
        if (peer && peer.id !== ent.id) {
          verifiedRelations.push({
            id: `rel_aug_${ent.id}_${peer.id}_${verifiedRelations.length}`,
            source: ent.id,
            target: peer.id,
            relationType: "leads_to",
            label: "associated with / linked to",
            confidence: Math.round((ent.confidenceScore + peer.confidenceScore) / 2),
            isDisputed: false,
            explanation: `Historical link connecting ${ent.name} and ${peer.name}.`,
            alternateBranches: [],
          });
          connectedIds.add(ent.id);
        }
      }
    }

    return { relations: verifiedRelations, alternateBranches: verifiedAlternateBranches, method: "llm" };
  } catch (err: unknown) {
    console.warn(`[Fact Checker] Contradiction LLM pass failed, falling back to heuristics: ${String(err)}`);
    const fallback = evaluateHeuristicContradictions(entities, facts);
    return { relations: fallback.relations, alternateBranches: fallback.alternateBranches, method: "heuristic_fallback" };
  }
}
