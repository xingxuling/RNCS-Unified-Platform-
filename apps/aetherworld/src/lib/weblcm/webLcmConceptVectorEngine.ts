import type { AetherConcept, SymbolicVector } from "./webLcmTypes";

const DIM = 32;

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function buildSymbolicVector(concept: AetherConcept): SymbolicVector {
  const values = new Array<number>(DIM).fill(0);
  const tokens = [
    concept.conceptType,
    concept.abstractionLevel,
    ...concept.keywords,
    ...concept.domainTags,
    ...concept.calculusTags,
    ...concept.constantTags,
  ];
  for (const t of tokens) {
    if (!t) continue;
    const idx = hashString(String(t)) % DIM;
    values[idx] += 1;
  }
  const norm = Math.sqrt(values.reduce((s, v) => s + v * v, 0)) || 1;
  for (let i = 0; i < DIM; i++) values[i] = +(values[i] / norm).toFixed(4);
  return { vectorType: "SYMBOLIC_HASH", dimensions: DIM, values };
}

export function attachVectors(concepts: AetherConcept[]): AetherConcept[] {
  return concepts.map(c => ({ ...c, semanticVector: buildSymbolicVector(c) }));
}

export function cosineSimilarity(a: SymbolicVector, b: SymbolicVector): number {
  if (a.dimensions !== b.dimensions) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.dimensions; i++) {
    dot += a.values[i] * b.values[i];
    na += a.values[i] * a.values[i];
    nb += b.values[i] * b.values[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
