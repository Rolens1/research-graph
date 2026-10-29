import type { CandidateEntity, ExtractedFact } from "@/types/reader";
import type { SourceCitation } from "@/types/graph";
import type {
  VerifiedEntity,
  GranularAmbiguity,
  VerifiedCausalRelation,
} from "@/types/fact-checker";

export function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "unknown-domain";
  }
}

export function toEntitySlug(entityType: string, name: string): string {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${entityType.toLowerCase()}_${cleanName || "unknown"}`;
}

export function calculateMultiFactorConfidence(options: {
  distinctDomainCount: number;
  hasAmbiguity: boolean;
  isDisputed: boolean;
  baseCredibility?: number;
}): number {
  const base = Math.max(20, Math.min(60, options.baseCredibility ?? 40));
  let score = base;

  if (options.distinctDomainCount >= 2) {
    score += 30;
    if (options.distinctDomainCount >= 3) score += 15;
  }
  if (options.hasAmbiguity) score -= 15;
  if (options.isDisputed) score -= 30;
  if (options.distinctDomainCount <= 1) score = Math.min(score, 70);

  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|corp|corporation|ltd|llc|co|company|auto|motors|holdings|group|labs|technologies|technology)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function findMatchingClusterKey<T>(map: Map<string, T>, key: string): string | null {
  if (map.has(key)) return key;
  if (key.length >= 3) {
    for (const existingKey of map.keys()) {
      if (existingKey.length >= 3 && (existingKey === key || existingKey.startsWith(key) || key.startsWith(existingKey))) {
        return existingKey;
      }
    }
  }
  return null;
}

function extractMonetaryAmounts(text: string): string[] {
  const regex = /\$\s?\d+(?:\.\d+)?\s*(?:billion|million|trillion|k|m|b)?\b/gi;
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) matches.push(m[0].trim());
  return matches;
}

export function detectFieldAmbiguities(items: {
  temporalAnchors: { value: string; url: string }[];
  names: { value: string; url: string }[];
  snippets: { text: string; url: string }[];
}): GranularAmbiguity[] {
  const ambiguities: GranularAmbiguity[] = [];

  const dateCandidates = Array.from(new Set(items.temporalAnchors.map((d) => d.value.trim()))).filter((d) => d.length > 0);
  if (dateCandidates.length >= 2) {
    ambiguities.push({
      field: "temporalAnchor",
      candidates: dateCandidates,
      reason: "Sources provide conflicting calendar dates or timeframes for this milestone",
      detectedInSources: Array.from(new Set(items.temporalAnchors.map((d) => d.url))),
    });
  }

  const nameCandidates = Array.from(new Set(items.names.map((n) => n.value.trim()))).filter((n) => n.length > 0);
  if (nameCandidates.length >= 2) {
    const cleanNames = nameCandidates.map((n) => normalizeName(n));
    const allNormalizedMatch = cleanNames.every((n) => n === cleanNames[0]);
    if (!allNormalizedMatch) {
      ambiguities.push({
        field: "entityName",
        candidates: nameCandidates,
        reason: "Sources record alternate spellings or nomenclature for entity",
        detectedInSources: Array.from(new Set(items.names.map((n) => n.url))),
      });
    }
  }

  const foundAmounts: { amount: string; url: string }[] = [];
  for (const s of items.snippets) {
    for (const amt of extractMonetaryAmounts(s.text)) foundAmounts.push({ amount: amt, url: s.url });
  }
  const uniqueAmounts = Array.from(new Set(foundAmounts.map((a) => a.amount)));
  if (uniqueAmounts.length >= 2) {
    ambiguities.push({
      field: "financialValuation",
      candidates: uniqueAmounts,
      reason: "Sources cite divergent valuation or financial figures for event",
      detectedInSources: Array.from(new Set(foundAmounts.map((a) => a.url))),
    });
  }

  return ambiguities;
}

export function clusterEntities(
  candidateEntities: CandidateEntity[],
  extractedFacts: ExtractedFact[],
): VerifiedEntity[] {
  const clusterMap = new Map<string, {
    primaryName: string;
    entityType: CandidateEntity["entityType"];
    summaries: string[];
    temporalAnchors: { value: string; url: string }[];
    names: { value: string; url: string }[];
    snippets: { text: string; url: string }[];
    sources: SourceCitation[];
    domains: Set<string>;
  }>();

  for (const candidate of candidateEntities) {
    const key = normalizeName(candidate.name) || candidate.name.toLowerCase();
    const domain = extractDomainFromUrl(candidate.sourceUrl);
    const matchedKey = findMatchingClusterKey(clusterMap, key);

    if (!matchedKey) {
      clusterMap.set(key, {
        primaryName: candidate.name,
        entityType: candidate.entityType,
        summaries: [candidate.significance],
        temporalAnchors: candidate.temporalAnchor ? [{ value: candidate.temporalAnchor, url: candidate.sourceUrl }] : [],
        names: [{ value: candidate.name, url: candidate.sourceUrl }],
        snippets: [{ text: candidate.quoteSnippet, url: candidate.sourceUrl }],
        sources: [{ url: candidate.sourceUrl, title: candidate.name, verbatimSnippet: candidate.quoteSnippet, credibilityScore: 80 }],
        domains: new Set([domain]),
      });
    } else {
      const existing = clusterMap.get(matchedKey)!;
      existing.summaries.push(candidate.significance);
      existing.names.push({ value: candidate.name, url: candidate.sourceUrl });
      existing.snippets.push({ text: candidate.quoteSnippet, url: candidate.sourceUrl });
      existing.domains.add(domain);
      if (candidate.temporalAnchor) existing.temporalAnchors.push({ value: candidate.temporalAnchor, url: candidate.sourceUrl });
      if (!existing.sources.some((s) => s.url === candidate.sourceUrl)) {
        existing.sources.push({ url: candidate.sourceUrl, title: candidate.name, verbatimSnippet: candidate.quoteSnippet, credibilityScore: 80 });
      }
    }
  }

  for (const fact of extractedFacts) {
    for (const involved of fact.entitiesInvolved) {
      const key = normalizeName(involved) || involved.toLowerCase();
      const matchedKey = findMatchingClusterKey(clusterMap, key);
      if (matchedKey) {
        const existing = clusterMap.get(matchedKey)!;
        existing.domains.add(fact.sourceDomain || extractDomainFromUrl(fact.sourceUrl));
        existing.snippets.push({ text: fact.quoteSnippet, url: fact.sourceUrl });
        if (fact.dateMentioned) existing.temporalAnchors.push({ value: fact.dateMentioned, url: fact.sourceUrl });
        if (!existing.sources.some((s) => s.url === fact.sourceUrl)) {
          existing.sources.push({
            url: fact.sourceUrl,
            title: fact.sourceTitle,
            verbatimSnippet: fact.quoteSnippet,
            credibilityScore: fact.confidenceScore || 80,
          });
        }
      }
    }
  }

  const results: VerifiedEntity[] = [];
  for (const [, cluster] of clusterMap.entries()) {
    const ambiguities = detectFieldAmbiguities({
      temporalAnchors: cluster.temporalAnchors,
      names: cluster.names,
      snippets: cluster.snippets,
    });
    const avgSourceCred = cluster.sources.length > 0
      ? cluster.sources.reduce((sum, s) => sum + (s.credibilityScore ?? 80), 0) / cluster.sources.length
      : 80;
    const baseCredibility = Math.round(avgSourceCred * 0.5);

    const confidenceScore = calculateMultiFactorConfidence({
      distinctDomainCount: cluster.domains.size,
      hasAmbiguity: ambiguities.length > 0,
      isDisputed: false,
      baseCredibility,
    });
    const slugId = toEntitySlug(cluster.entityType, cluster.primaryName);
    const chosenSummary = cluster.summaries[0] || `Corroborated entity for ${cluster.primaryName}`;
    const cleanSummary = chosenSummary.length >= 10 ? chosenSummary.slice(0, 480) : `Verified finding regarding ${cluster.primaryName}`;

    results.push({
      id: slugId,
      name: cluster.primaryName,
      entityType: cluster.entityType,
      summary: cleanSummary,
      confidenceScore,
      temporalAnchor: cluster.temporalAnchors[0]?.value,
      corroboratingDomains: Array.from(cluster.domains),
      sources: cluster.sources,
      ambiguities,
      isContested: false,
    });
  }
  return results;
}

export function calculateInvestigationConfidence(
  entities: VerifiedEntity[],
  relations: VerifiedCausalRelation[],
): { overallScore: number; corroborationRatio: number } {
  if (entities.length === 0) return { overallScore: 0, corroborationRatio: 0 };

  const multiDomainCount = entities.filter((e) => e.corroboratingDomains.length >= 2).length;
  const corroborationRatio = Math.round((multiDomainCount / entities.length) * 100) / 100;

  if (entities.length === 1 && entities[0].corroboratingDomains.length <= 1) {
    return { overallScore: Math.min(65, entities[0].confidenceScore), corroborationRatio: 0 };
  }

  const avgEntityConfidence = entities.reduce((acc, curr) => acc + curr.confidenceScore, 0) / entities.length;
  let overall = avgEntityConfidence;
  if (relations.length > 0) {
    const avgRelConfidence = relations.reduce((acc, curr) => acc + curr.confidence, 0) / relations.length;
    overall = avgEntityConfidence * 0.65 + avgRelConfidence * 0.35;
  }

  const densityBonus = corroborationRatio * 10;
  return { overallScore: Math.max(0, Math.min(100, Math.round(overall + densityBonus - 5))), corroborationRatio };
}
