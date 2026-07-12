import type { AetherConcept, ConceptSearchResult } from "./webLcmTypes";
import { buildSymbolicVector, cosineSimilarity } from "./webLcmConceptVectorEngine";
import { extractConcepts } from "./webLcmConceptExtractor";

export interface SearchOptions {
  topK?: number;
  matchBy?: "KEYWORD" | "TAG" | "VECTOR" | "HYBRID";
}

export function searchConcepts(query: string, corpus: AetherConcept[], opts: SearchOptions = {}): ConceptSearchResult {
  const topK = opts.topK ?? 8;
  const matchBy = opts.matchBy ?? "HYBRID";
  const queryConcept = extractConcepts({ text: query, sourceType: "USER_INPUT" })[0];
  const queryVec = queryConcept ? buildSymbolicVector(queryConcept) : null;
  const qLower = query.toLowerCase();
  const scored = corpus.map(c => {
    let score = 0;
    if (matchBy === "KEYWORD" || matchBy === "HYBRID") {
      const kwHit = c.keywords.filter(k => qLower.includes(k.toLowerCase()) || k.toLowerCase().includes(qLower)).length;
      score += kwHit * 0.3;
      if (c.title.toLowerCase().includes(qLower)) score += 0.4;
    }
    if ((matchBy === "VECTOR" || matchBy === "HYBRID") && queryVec) {
      const v = c.semanticVector ?? buildSymbolicVector(c);
      score += cosineSimilarity(queryVec, v) * 0.6;
    }
    if (matchBy === "TAG" || matchBy === "HYBRID") {
      const tagHit = [...c.domainTags, ...c.calculusTags, ...c.constantTags]
        .filter(t => qLower.includes(t.toLowerCase())).length;
      score += tagHit * 0.2;
    }
    return { c, score };
  }).sort((a, b) => b.score - a.score);
  const results = scored.filter(s => s.score > 0).slice(0, topK).map(s => s.c);
  return {
    query,
    results,
    matchedBy: matchBy,
    confidence: results.length ? Math.min(0.95, scored[0].score) : 0,
  };
}
