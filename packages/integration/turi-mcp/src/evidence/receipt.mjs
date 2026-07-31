import fs from 'node:fs';
import path from 'node:path';
import { clone, nowIso, randomId, safeFileStem, sha256 } from '../canonical.mjs';

const gradeFor = (manifest, { executed = true, verified = false } = {}) => {
  if (manifest.implementation === 'mock') return 'DECLARED';
  if (manifest.implementation === 'evidence_only') return 'STATIC_VERIFIED';
  if (verified || manifest.evidenceLevel === 'verified') return 'RUNTIME_VERIFIED';
  if (executed || manifest.evidenceLevel === 'executed') return 'EXECUTED';
  if (manifest.evidenceLevel === 'static') return 'STATIC_VERIFIED';
  return 'DECLARED';
};

export function createEvidenceReceipt(manifest, input, output, options = {}) {
  const receipt = {
    format: 'turi.evidence-receipt.v0.1',
    receiptId: randomId('receipt'),
    timestamp: nowIso(),
    capabilityId: manifest.capabilityId,
    implementation: manifest.implementation,
    executionGrade: options.executionGrade ?? gradeFor(manifest, options),
    inputHash: `sha256:${sha256(input)}`,
    outputHash: output === undefined ? undefined : `sha256:${sha256(output)}`,
    stateRootBefore: options.stateRootBefore ?? undefined,
    stateRootAfter: options.stateRootAfter ?? undefined,
    candidateId: options.candidateId ?? undefined,
    revision: options.revision === undefined ? undefined : String(options.revision),
    generation: options.generation === undefined ? undefined : options.generation,
    artifacts: clone(options.artifacts ?? []),
    warnings: [...(options.warnings ?? [])],
    limitations: [...(options.limitations ?? [])],
    rollbackRef: options.rollbackRef ?? undefined,
  };
  return Object.fromEntries(Object.entries(receipt).filter(([, value]) => value !== undefined));
}

export class ReceiptStore {
  constructor(dataDir) {
    this.dir = path.resolve(dataDir, 'evidence');
    fs.mkdirSync(this.dir, { recursive: true });
  }

  save(receipt) {
    const file = path.join(this.dir, `${safeFileStem(receipt.receiptId)}.json`);
    fs.writeFileSync(file, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
    return receipt;
  }

  get(receiptId) {
    if (typeof receiptId !== 'string' || !/^receipt:[0-9a-f-]+$/.test(receiptId)) return null;
    const file = path.join(this.dir, `${safeFileStem(receiptId)}.json`);
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  }

  list(limit = 50) {
    return fs.readdirSync(this.dir).filter((file) => file.endsWith('.json')).sort().slice(-limit).map((file) => JSON.parse(fs.readFileSync(path.join(this.dir, file), 'utf8')));
  }
}
