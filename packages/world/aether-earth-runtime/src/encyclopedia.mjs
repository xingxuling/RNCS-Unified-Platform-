import { realityRoot } from './canonical.mjs';

const CLIMATES = ['oceanic', 'temperate', 'arid', 'tundra'];
const RESOURCES = ['water', 'biomass', 'mineral', 'thermal', 'shelter', 'light', 'soil', 'air'];
const DOMAINS = ['energy', 'element', 'body', 'life', 'genetic', 'science', 'knowledge', 'spacetime'];

function entryId(index) {
  return `rclpedia:${String(index).padStart(4, '0')}`;
}

export function generateSeedEntries(count = 512) {
  if (!Number.isInteger(count) || count < 1) throw new RangeError('entry count must be positive');
  const entries = [];
  for (let index = 0; index < count; index += 1) {
    const climate = CLIMATES[index % CLIMATES.length];
    const resource = RESOURCES[Math.floor(index / CLIMATES.length) % RESOURCES.length];
    const domain = DOMAINS[Math.floor(index / (CLIMATES.length * RESOURCES.length)) % DOMAINS.length];
    const relation = index % 3 === 0 ? 'supports' : index % 3 === 1 ? 'constrains' : 'correlates-with';
    entries.push({
      id: entryId(index + 1),
      kind: 'KnowledgeClaim',
      subject: `${climate}.${resource}`,
      relation,
      object: `${domain}.stability`,
      scope: `earthlike:${climate}`,
      confidence: Number((0.72 + ((index % 23) / 100)).toFixed(2)),
      evidence: [`seed:curated-template:${domain}`, `rule:${climate}:${resource}`],
      status: 'seeded',
      revision: 0,
      observations: 0,
      conflicts: [],
    });
  }
  return entries;
}

export class Rclpedia {
  constructor(entries = generateSeedEntries()) {
    this.entries = new Map(entries.map(entry => [entry.id, structuredClone(entry)]));
    this.claimIndex = new Map();
    for (const entry of this.entries.values()) {
      this.claimIndex.set(`${entry.subject}|${entry.relation}|${entry.object}`, entry.id);
    }
  }

  get size() { return this.entries.size; }

  observe({ subject, relation, object, evidence, confidence = 0.6, scope = 'sandbox' }) {
    const key = `${subject}|${relation}|${object}`;
    const existingId = this.claimIndex.get(key);
    if (existingId) {
      const entry = this.entries.get(existingId);
      entry.observations += 1;
      entry.confidence = Number(Math.min(0.999, entry.confidence + (1 - entry.confidence) * 0.035).toFixed(4));
      if (evidence && !entry.evidence.includes(evidence)) {
        entry.evidence.push(evidence);
        if (entry.evidence.length > 32) entry.evidence.splice(0, entry.evidence.length - 32);
      }
      entry.revision += 1;
      entry.status = entry.observations >= 5 ? 'observed' : entry.status;
      return structuredClone(entry);
    }
    const id = `rclpedia:derived:${realityRoot({ subject, relation, object, scope }).slice(0, 16)}`;
    const entry = {
      id, kind: 'KnowledgeClaim', subject, relation, object, scope,
      confidence: Number(confidence.toFixed(4)), evidence: evidence ? [evidence] : [],
      status: 'candidate', revision: 0, observations: 1, conflicts: [],
    };
    this.entries.set(id, entry);
    this.claimIndex.set(key, id);
    return structuredClone(entry);
  }

  search(query, limit = 20) {
    const needle = String(query).toLowerCase();
    return [...this.entries.values()]
      .filter(entry => JSON.stringify(entry).toLowerCase().includes(needle))
      .sort((a, b) => b.confidence - a.confidence || b.observations - a.observations)
      .slice(0, limit)
      .map(entry => structuredClone(entry));
  }

  topObserved(limit = 20) {
    return [...this.entries.values()]
      .filter(entry => entry.observations > 0)
      .sort((a, b) => b.observations - a.observations || b.confidence - a.confidence)
      .slice(0, limit)
      .map(entry => structuredClone(entry));
  }

  toJSON() {
    return [...this.entries.values()].sort((a, b) => a.id.localeCompare(b.id));
  }
}
