import { semanticHash, canonicalClone, canonicalJson, compareUtf8, isSha256 } from '@taowind/world-body-ir';

export const FORMAL_KERNEL_VERSION = '0.1.0-alpha.1';
export const THEOREM_RECEIPT_FORMAT = 'taowind.formal-theorem-receipt.v0.1';
export const PROOF_BUNDLE_FORMAT = 'taowind.formal-proof-bundle.v0.1';

export const THEOREM_CLASSIFICATIONS = Object.freeze([
  'EXACT',
  'BOUNDED_NUMERIC',
  'CONDITIONAL',
  'PROPERTY_TESTED',
  'UNVERIFIED_EXTERNAL',
]);

export const EVIDENCE_CLASSES = Object.freeze([
  'STATIC_INSPECTION',
  'REFERENCE_EXECUTION',
  'PRODUCTION_DIFFERENTIAL',
  'EXTERNAL_BACKEND',
]);

export const REQUIRED_F5_EXTERNAL_BACKEND_IDS = Object.freeze([
  'external-physics-engine',
  'full-world-body-native-vm',
  'production-asset-provider',
  'real-distributed-network',
  'target-browser-gpu-pixels',
  'target-hardware-performance',
]);
export const REQUIRED_REFERENCE_DOMAINS = Object.freeze(['RSR', 'VSR', 'WORLD_BODY']);

const THEOREM_ID = /^(?:(?:RSR|VSR|RCL)-T[1-5](?:\.[0-9]+)?|WB-T(?:[1-9]|10)(?:\.[0-9]+)?)$/;

function assertText(value, name) {
  if (typeof value !== 'string' || value.length === 0) throw new TypeError(`${name} must be a non-empty string`);
}

export function defineTheorem(definition) {
  if (!definition || typeof definition !== 'object') throw new TypeError('theorem definition must be an object');
  if (!THEOREM_ID.test(definition.id)) throw new TypeError(`invalid theorem id ${definition.id}`);
  if (!Number.isInteger(definition.level) || definition.level < 1 || definition.level > 5) throw new TypeError(`invalid theorem level ${definition.level}`);
  assertText(definition.domain, 'domain');
  assertText(definition.title, 'title');
  assertText(definition.statement, 'statement');
  if (!THEOREM_CLASSIFICATIONS.includes(definition.classification)) throw new TypeError(`invalid theorem classification ${definition.classification}`);
  if (!Array.isArray(definition.assumptions) || definition.assumptions.some(item => typeof item !== 'string')) throw new TypeError('theorem assumptions must be strings');
  if (definition.classification !== 'UNVERIFIED_EXTERNAL' && typeof definition.predicate !== 'function') throw new TypeError(`${definition.id} requires an executable predicate`);
  return Object.freeze({
    id: definition.id,
    domain: definition.domain,
    level: definition.level,
    title: definition.title,
    statement: definition.statement,
    classification: definition.classification,
    assumptions: Object.freeze([...definition.assumptions]),
    predicate: definition.predicate ?? null,
  });
}

export function assertTheoremRegistry(theorems, options = {}) {
  if (!Array.isArray(theorems) || theorems.length === 0) throw new TypeError('theorem registry must be a non-empty array');
  const ids = new Set();
  const levels = new Set();
  for (const theorem of theorems) {
    defineTheorem(theorem);
    if (ids.has(theorem.id)) throw new TypeError(`duplicate theorem id ${theorem.id}`);
    ids.add(theorem.id);
    levels.add(theorem.level);
  }
  if (options.requireFiveLevels !== false) {
    for (let level = 1; level <= 5; level += 1) {
      if (!levels.has(level)) throw new TypeError(`theorem registry is missing level ${level}`);
    }
  }
  return { theoremCount: theorems.length, theoremIds: [...ids].sort(), levels: [...levels].sort() };
}

function normalizeOutcome(raw) {
  if (typeof raw === 'boolean') return { status: raw ? 'PASS' : 'FAIL', observations: {} };
  if (!raw || typeof raw !== 'object') throw new TypeError('theorem predicate must return boolean or an outcome object');
  const status = raw.status ?? (raw.ok === true ? 'PASS' : raw.ok === false ? 'FAIL' : 'UNVERIFIED');
  if (!['PASS', 'FAIL', 'UNVERIFIED'].includes(status)) throw new TypeError(`invalid theorem outcome ${status}`);
  return { status, observations: canonicalClone(raw.observations ?? {}), reason: raw.reason ?? null };
}

export async function evaluateTheorem(theorem, subject, options = {}) {
  defineTheorem(theorem);
  const evidenceClass = options.evidenceClass ?? 'REFERENCE_EXECUTION';
  if (!EVIDENCE_CLASSES.includes(evidenceClass)) throw new TypeError(`invalid evidence class ${evidenceClass}`);
  let outcome;
  try {
    outcome = theorem.classification === 'UNVERIFIED_EXTERNAL'
      ? { status: 'UNVERIFIED', observations: {}, reason: options.reason ?? 'external backend was not executed' }
      : normalizeOutcome(await theorem.predicate(subject, options.context ?? {}));
  } catch (error) {
    outcome = {
      status: 'FAIL',
      observations: { errorCode: String(error?.code ?? error?.name ?? 'ERROR') },
      reason: String(error?.message ?? error),
    };
  }
  const base = {
    format: THEOREM_RECEIPT_FORMAT,
    kernelVersion: FORMAL_KERNEL_VERSION,
    theorem: {
      id: theorem.id,
      domain: theorem.domain,
      level: theorem.level,
      title: theorem.title,
      statement: theorem.statement,
      classification: theorem.classification,
      assumptions: [...theorem.assumptions],
    },
    subjectRoot: semanticHash(subject),
    evidenceClass,
    implementation: options.implementation ?? 'reference',
    status: outcome.status,
    observations: outcome.observations,
    reason: outcome.reason,
  };
  return canonicalClone({ ...base, witnessRoot: semanticHash(base) });
}

export function verifyTheoremReceipt(receipt) {
  try {
    if (!receipt || receipt.format !== THEOREM_RECEIPT_FORMAT || !isSha256(receipt.witnessRoot)) return false;
    if (receipt.kernelVersion !== FORMAL_KERNEL_VERSION
      || !receipt.theorem
      || !THEOREM_ID.test(receipt.theorem.id)
      || typeof receipt.theorem.domain !== 'string'
      || receipt.theorem.domain.length === 0
      || !Number.isInteger(receipt.theorem.level)
      || receipt.theorem.level < 1
      || receipt.theorem.level > 5
      || typeof receipt.theorem.title !== 'string'
      || receipt.theorem.title.length === 0
      || typeof receipt.theorem.statement !== 'string'
      || receipt.theorem.statement.length === 0
      || !THEOREM_CLASSIFICATIONS.includes(receipt.theorem.classification)
      || !Array.isArray(receipt.theorem.assumptions)
      || receipt.theorem.assumptions.some(item => typeof item !== 'string')
      || !isSha256(receipt.subjectRoot)
      || !EVIDENCE_CLASSES.includes(receipt.evidenceClass)
      || typeof receipt.implementation !== 'string'
      || receipt.implementation.length === 0
      || !['PASS', 'FAIL', 'UNVERIFIED'].includes(receipt.status)
      || (receipt.theorem.classification === 'UNVERIFIED_EXTERNAL' && receipt.status !== 'UNVERIFIED')
      || (receipt.reason !== null && typeof receipt.reason !== 'string')) return false;
    const { witnessRoot, ...base } = receipt;
    return semanticHash(base) === witnessRoot;
  } catch {
    return false;
  }
}

export async function evaluateTheoremSuite(theorems, subject, options = {}) {
  const registry = assertTheoremRegistry(theorems, options);
  const receipts = [];
  for (const theorem of theorems) receipts.push(await evaluateTheorem(theorem, subject, options));
  return createProofBundle(receipts, { domain: options.domain ?? theorems[0].domain, registry });
}

export function createProofBundle(receipts, options = {}) {
  if (!Array.isArray(receipts) || receipts.some(receipt => !verifyTheoremReceipt(receipt))) throw new TypeError('all proof receipts must be valid sealed theorem receipts');
  const ordered = [...receipts].sort((left, right) => compareUtf8(left.theorem.id, right.theorem.id));
  const counts = { PASS: 0, FAIL: 0, UNVERIFIED: 0 };
  ordered.forEach(receipt => { counts[receipt.status] += 1; });
  const base = {
    format: PROOF_BUNDLE_FORMAT,
    kernelVersion: FORMAL_KERNEL_VERSION,
    domain: options.domain ?? 'world-body',
    theoremCount: ordered.length,
    counts,
    receiptRoots: ordered.map(receipt => receipt.witnessRoot),
    status: counts.FAIL > 0 ? 'FAIL' : counts.UNVERIFIED > 0 ? 'PARTIAL' : 'PASS',
  };
  return canonicalClone({ ...base, bundleRoot: semanticHash(base), receipts: ordered });
}

export function verifyProofBundle(bundle) {
  try {
    if (!bundle || bundle.format !== PROOF_BUNDLE_FORMAT || !Array.isArray(bundle.receipts)) return false;
    if (bundle.receipts.some(receipt => !verifyTheoremReceipt(receipt))) return false;
    const expected = createProofBundle(bundle.receipts, { domain: bundle.domain });
    return isSha256(bundle.bundleRoot) && canonicalJson(expected) === canonicalJson(bundle);
  } catch {
    return false;
  }
}

export function classifyFormalMaturity({ referenceBundles = [], productionDifferentials = [], externalBackends = [] } = {}) {
  if (referenceBundles.some(bundle => !verifyProofBundle(bundle))) return { verdict: 'Blocked', reason: 'at least one reference proof bundle is invalid or tampered' };
  const referenceReceipts = referenceBundles.flatMap(bundle => bundle?.receipts ?? []);
  if (referenceReceipts.length === 0) return { verdict: 'Candidate', reason: 'no executed reference theorem receipts' };
  if (referenceReceipts.some(receipt => receipt.status === 'FAIL')) return { verdict: 'Blocked', reason: 'at least one reference theorem failed' };
  for (const domain of REQUIRED_REFERENCE_DOMAINS) {
    const bundles = referenceBundles.filter(bundle => bundle.domain === domain);
    if (bundles.length !== 1) return { verdict: 'Candidate', reason: `reference domain ${domain} must have exactly one verified proof bundle` };
    const domainReceipts = bundles[0].receipts;
    if (domainReceipts.some(receipt => receipt.theorem.domain !== domain)) return { verdict: 'Candidate', reason: `reference domain ${domain} contains a foreign theorem receipt` };
    const executableLevels = new Set(domainReceipts
      .filter(receipt => receipt.theorem.classification !== 'UNVERIFIED_EXTERNAL' && receipt.status === 'PASS')
      .map(receipt => receipt.theorem.level));
    if ([1, 2, 3, 4, 5].some(level => !executableLevels.has(level))) return { verdict: 'Candidate', reason: `reference domain ${domain} does not close all five executable levels` };
  }
  const executableReference = referenceReceipts.filter(receipt => receipt.theorem.classification !== 'UNVERIFIED_EXTERNAL');
  if (executableReference.length === 0 || executableReference.some(receipt => receipt.status !== 'PASS')) {
    return { verdict: 'Candidate', reason: 'reference theorem closure is incomplete' };
  }
  const differentialPasses = productionDifferentials.filter(receipt => receipt?.status === 'PASS'
    && isSha256(receipt.evidenceRoot)
    && ['PARTIAL_PRODUCTION_DIFFERENTIAL', 'FULL_PRODUCTION_DIFFERENTIAL'].includes(receipt.evidenceClass));
  if (differentialPasses.length === 0) return { verdict: 'F4 Verified', reason: 'reference formal closure passed without production differential evidence' };
  const externalById = new Map();
  for (const receipt of externalBackends) {
    const entries = externalById.get(receipt?.id) ?? [];
    entries.push(receipt);
    externalById.set(receipt?.id, entries);
  }
  const missingExternalBackendIds = REQUIRED_F5_EXTERNAL_BACKEND_IDS.filter(id => {
    const entries = externalById.get(id) ?? [];
    return entries.length !== 1
      || entries[0].status !== 'PASS'
      || entries[0].evidenceClass !== 'EXTERNAL_BACKEND'
      || !isSha256(entries[0].evidenceRoot);
  });
  const hasFullProductionDifferential = differentialPasses.some(receipt => receipt.evidenceClass === 'FULL_PRODUCTION_DIFFERENTIAL');
  if (!hasFullProductionDifferential || missingExternalBackendIds.length > 0) {
    return {
      verdict: 'F4.5 Partial Production Parity',
      reason: !hasFullProductionDifferential
        ? 'targeted production differential passed without a sealed full-production differential'
        : 'full-production differential passed while required external backend coverage remains incomplete',
      hasFullProductionDifferential,
      missingExternalBackendIds,
    };
  }
  return { verdict: 'F5 Differentially Verified', reason: 'sealed full-production differential and every required external backend gate passed', hasFullProductionDifferential, missingExternalBackendIds: [] };
}
