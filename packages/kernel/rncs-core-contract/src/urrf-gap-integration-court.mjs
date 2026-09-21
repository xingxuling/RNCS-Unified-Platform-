import {rootHash, without} from './index.mjs';
import {
  URRF_K400_GATES,
  URRF_V03_COVERAGE_STATUSES,
  createURRFV03CoverageMatrix,
  verifyURRFV03CoverageMatrix
} from './urrf-v03-coverage.mjs';

export const URRF_GAP_LEDGER_FORMAT = 'rncs.urrf-gap-ledger.v0.1';
export const URRF_INTEGRATION_COURT_FORMAT = 'rncs.urrf-integration-court-verdict.v0.1';
export const URRF_GAP_LEDGER_VERSION = '0.1.0';
export const URRF_GAP_TYPES = Object.freeze(['RCL_GAP', 'PROVIDER_GAP', 'MIXED']);
export const URRF_GAP_GENERALITIES = Object.freeze(['CROSS_PROJECT', 'DOMAIN_LOCAL', 'HOST_LOCAL']);
export const URRF_GAP_ABSORPTION_STATUSES = Object.freeze(['PENDING', 'CANDIDATE', 'NOT_APPLICABLE']);

const clone = value => structuredClone(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const root = value => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const strings = value => [...new Set((Array.isArray(value) ? value : []).map(item => String(item).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'en'));

const authorityBoundary = () => ({
  canonical_owner: 'RNCS',
  semantic_owner: 'RCL',
  representation_owner: 'URRF',
  provider_can_write_authoritative_world_state: false,
  provider_can_commit: false,
  rcl_promotion_authorized: false,
  canonical_write_authorized: false,
  candidate_only: true
});

const rooted = (value, field) => {
  const copy = clone(value);
  delete copy[field];
  copy[field] = rootHash(copy);
  return copy;
};

function normalizeGapEntry(input = {}) {
  const donor = input.donor ?? {};
  const workaround = input.workaround ?? {};
  const absorption = input.candidate_absorption ?? {};
  const entry = {
    gap_id: String(input.gap_id ?? '').trim(),
    task_refs: strings(input.task_refs),
    gap_type: String(input.gap_type ?? '').trim().toUpperCase(),
    missing_capability: String(input.missing_capability ?? '').trim(),
    provider_id: input.provider_id === undefined || input.provider_id === null ? null : String(input.provider_id).trim(),
    workaround: {
      owner_layer: String(workaround.owner_layer ?? '').trim(),
      language: String(workaround.language ?? '').trim(),
      semantic_owner: String(workaround.semantic_owner ?? 'RCL').trim(),
      canonical_owner: String(workaround.canonical_owner ?? 'RNCS').trim(),
      candidate_only: workaround.candidate_only !== false,
      description: String(workaround.description ?? '').trim()
    },
    donor: {
      donor_id: String(donor.donor_id ?? '').trim(),
      owner_layer: String(donor.owner_layer ?? '').trim(),
      advantage: String(donor.advantage ?? '').trim(),
      source_refs: strings(donor.source_refs),
      evidence_refs: strings(donor.evidence_refs)
    },
    generality: String(input.generality ?? '').trim().toUpperCase(),
    candidate_absorption: {
      status: String(absorption.status ?? '').trim().toUpperCase(),
      primitive_candidates: strings(absorption.primitive_candidates),
      regression_cases: strings(absorption.regression_cases)
    },
    affected_k400_cells: strings(input.affected_k400_cells),
    evidence_refs: strings(input.evidence_refs),
    authority: authorityBoundary(),
    entry_root: ''
  };
  return rooted(entry, 'entry_root');
}

function verifyGapEntry(entry) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return {valid: false, errors: ['GAP_ENTRY_NOT_OBJECT']};
  check(text(entry.gap_id), 'GAP_ID_INVALID');
  check(Array.isArray(entry.task_refs) && entry.task_refs.length > 0 && entry.task_refs.every(item => /^URRF-\d{2}$/.test(item)), 'GAP_TASK_REFS_INVALID');
  check(URRF_GAP_TYPES.includes(entry.gap_type), 'GAP_TYPE_INVALID');
  check(text(entry.missing_capability), 'GAP_MISSING_CAPABILITY_INVALID');
  check(entry.workaround?.candidate_only === true, 'GAP_WORKAROUND_NOT_CANDIDATE_ONLY');
  check(entry.workaround?.semantic_owner === 'RCL', 'GAP_WORKAROUND_SEMANTIC_OWNER_INVALID');
  check(entry.workaround?.canonical_owner === 'RNCS', 'GAP_WORKAROUND_CANONICAL_OWNER_INVALID');
  check(text(entry.workaround?.owner_layer) && text(entry.workaround?.language) && text(entry.workaround?.description), 'GAP_WORKAROUND_INVALID');
  check(text(entry.donor?.donor_id) && text(entry.donor?.owner_layer) && text(entry.donor?.advantage), 'GAP_DONOR_INVALID');
  check(Array.isArray(entry.donor?.source_refs) && entry.donor.source_refs.length > 0, 'GAP_DONOR_SOURCE_REFS_MISSING');
  check(Array.isArray(entry.donor?.evidence_refs) && entry.donor.evidence_refs.length > 0, 'GAP_DONOR_EVIDENCE_REFS_MISSING');
  check(URRF_GAP_GENERALITIES.includes(entry.generality), 'GAP_GENERALITY_INVALID');
  check(URRF_GAP_ABSORPTION_STATUSES.includes(entry.candidate_absorption?.status), 'GAP_ABSORPTION_STATUS_INVALID');
  check(Array.isArray(entry.candidate_absorption?.regression_cases) && entry.candidate_absorption.regression_cases.length > 0, 'GAP_REGRESSION_CASES_MISSING');
  check(Array.isArray(entry.affected_k400_cells) && entry.affected_k400_cells.length > 0, 'GAP_K400_CELLS_MISSING');
  for (const cell of entry.affected_k400_cells ?? []) {
    const match = /^K400:(URRF-\d{2}):([A-Z_]+)$/.exec(cell);
    check(Boolean(match) && entry.task_refs.includes(match?.[1]) && URRF_K400_GATES.includes(match?.[2]), `GAP_K400_CELL_INVALID:${cell}`);
  }
  check(Array.isArray(entry.evidence_refs) && entry.evidence_refs.length > 0, 'GAP_EVIDENCE_REFS_MISSING');
  if (entry.gap_type === 'RCL_GAP' || entry.gap_type === 'MIXED') {
    check(entry.candidate_absorption.status !== 'NOT_APPLICABLE', 'RCL_GAP_ABSORPTION_MISSING');
    check(entry.candidate_absorption.primitive_candidates.length > 0, 'RCL_GAP_PRIMITIVE_CANDIDATE_MISSING');
  }
  if (entry.gap_type === 'PROVIDER_GAP' || entry.gap_type === 'MIXED') {
    check(text(entry.provider_id), 'PROVIDER_GAP_PROVIDER_ID_MISSING');
  }
  check(entry.authority?.canonical_owner === 'RNCS' && entry.authority?.semantic_owner === 'RCL' && entry.authority?.representation_owner === 'URRF', 'GAP_AUTHORITY_OWNER_INVALID');
  check(entry.authority?.provider_can_write_authoritative_world_state === false && entry.authority?.provider_can_commit === false && entry.authority?.rcl_promotion_authorized === false && entry.authority?.canonical_write_authorized === false && entry.authority?.candidate_only === true, 'GAP_AUTHORITY_ESCALATION');
  try {
    check(root(entry.entry_root) && rootHash(without(entry, 'entry_root')) === entry.entry_root, 'GAP_ENTRY_ROOT_INVALID');
  } catch (error) {
    errors.push(`GAP_ENTRY_ROOT_EXCEPTION:${error.code ?? error.message}`);
  }
  return {valid: errors.length === 0, errors, entry_root: entry.entry_root ?? null};
}

export function createURRFGAPEntry(input = {}) {
  const entry = normalizeGapEntry(input);
  const verification = verifyGapEntry(entry);
  if (!verification.valid) throw new Error(`URRF_GAP_ENTRY_INVALID:${verification.errors.join(',')}`);
  return entry;
}

export function verifyURRFGAPEntry(entry) {
  return verifyGapEntry(entry);
}

export function createURRFGAPLedger({ledger_id = 'urrf-gap-ledger-v01', entries = []} = {}) {
  const normalized = entries.map(createURRFGAPEntry).sort((a, b) => a.gap_id.localeCompare(b.gap_id, 'en'));
  if (!text(ledger_id) || normalized.length === 0) throw new Error('URRF_GAP_LEDGER_INPUT_INVALID');
  if (new Set(normalized.map(entry => entry.gap_id)).size !== normalized.length) throw new Error('URRF_GAP_LEDGER_DUPLICATE_ID');
  const ledger = {
    format: URRF_GAP_LEDGER_FORMAT,
    version: URRF_GAP_LEDGER_VERSION,
    ledger_id: String(ledger_id).trim(),
    purpose: 'rcl-gap-provider-gap-boundary-and-candidate-absorption-evidence',
    entries: normalized,
    summary: {
      entry_count: normalized.length,
      rcl_gap_count: normalized.filter(entry => entry.gap_type === 'RCL_GAP').length,
      provider_gap_count: normalized.filter(entry => entry.gap_type === 'PROVIDER_GAP').length,
      mixed_gap_count: normalized.filter(entry => entry.gap_type === 'MIXED').length,
      candidate_only: true
    },
    authority: authorityBoundary(),
    ledger_root: ''
  };
  return rooted(ledger, 'ledger_root');
}

export function verifyURRFGAPLedger(ledger) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger)) return {valid: false, errors: ['GAP_LEDGER_NOT_OBJECT'], ledger_root: null};
  check(ledger.format === URRF_GAP_LEDGER_FORMAT, 'GAP_LEDGER_FORMAT_INVALID');
  check(ledger.version === URRF_GAP_LEDGER_VERSION, 'GAP_LEDGER_VERSION_INVALID');
  check(text(ledger.ledger_id), 'GAP_LEDGER_ID_INVALID');
  check(Array.isArray(ledger.entries) && ledger.entries.length > 0, 'GAP_LEDGER_ENTRIES_INVALID');
  const ids = (ledger.entries ?? []).map(entry => entry?.gap_id);
  check(new Set(ids).size === ids.length, 'GAP_LEDGER_IDS_NOT_UNIQUE');
  for (const entry of ledger.entries ?? []) {
    const verification = verifyGapEntry(entry);
    if (!verification.valid) errors.push(...verification.errors.map(error => `${entry?.gap_id ?? 'unknown'}:${error}`));
  }
  check(ledger.summary?.entry_count === (ledger.entries ?? []).length, 'GAP_LEDGER_SUMMARY_COUNT_MISMATCH');
  check(ledger.summary?.rcl_gap_count === (ledger.entries ?? []).filter(entry => entry.gap_type === 'RCL_GAP').length, 'GAP_LEDGER_SUMMARY_RCL_MISMATCH');
  check(ledger.summary?.provider_gap_count === (ledger.entries ?? []).filter(entry => entry.gap_type === 'PROVIDER_GAP').length, 'GAP_LEDGER_SUMMARY_PROVIDER_MISMATCH');
  check(ledger.summary?.mixed_gap_count === (ledger.entries ?? []).filter(entry => entry.gap_type === 'MIXED').length, 'GAP_LEDGER_SUMMARY_MIXED_MISMATCH');
  check(ledger.summary?.candidate_only === true, 'GAP_LEDGER_SUMMARY_AUTHORITY_INVALID');
  check(rootHash(ledger.authority ?? {}) === rootHash(authorityBoundary()), 'GAP_LEDGER_AUTHORITY_BOUNDARY_INVALID');
  check(ledger.authority?.provider_can_write_authoritative_world_state === false && ledger.authority?.provider_can_commit === false && ledger.authority?.canonical_write_authorized === false, 'GAP_LEDGER_AUTHORITY_ESCALATION');
  try {
    check(root(ledger.ledger_root) && rootHash(without(ledger, 'ledger_root')) === ledger.ledger_root, 'GAP_LEDGER_ROOT_INVALID');
  } catch (error) {
    errors.push(`GAP_LEDGER_ROOT_EXCEPTION:${error.code ?? error.message}`);
  }
  return {valid: errors.length === 0, errors, ledger_root: ledger.ledger_root ?? null};
}

function courtChecks(matrix, ledger) {
  const matrixVerification = verifyURRFV03CoverageMatrix(matrix);
  const ledgerVerification = verifyURRFGAPLedger(ledger);
  const entries = Array.isArray(ledger?.entries) ? ledger.entries : [];
  const classifiedTasks = new Set(entries.flatMap(entry => entry.task_refs ?? []));
  const notVerified = (matrix?.criteria ?? []).filter(item => item.status !== 'CANDIDATE_LOCAL_VERIFIED');
  const validCells = entries.flatMap(entry => entry.affected_k400_cells ?? []).every(cell => {
    const match = /^K400:(URRF-\d{2}):([A-Z_]+)$/.exec(cell);
    return Boolean(match) && URRF_K400_GATES.includes(match[2]);
  });
  return {
    coverage_matrix_valid: matrixVerification.valid,
    gap_ledger_valid: ledgerVerification.valid,
    every_nonverified_criterion_classified: notVerified.every(item => classifiedTasks.has(item.criterion_id) && Array.isArray(item.remaining) && item.remaining.length > 0),
    donor_advantage_and_refs_bound: entries.every(entry => text(entry.donor?.advantage) && entry.donor.source_refs.length > 0 && entry.donor.evidence_refs.length > 0),
    k400_cells_bound: entries.length > 0 && entries.every(entry => entry.affected_k400_cells.length > 0) && validCells,
    no_silent_rcl_bypass: entries.every(entry => entry.authority?.semantic_owner === 'RCL' && entry.authority?.canonical_owner === 'RNCS' && entry.workaround?.candidate_only === true && entry.authority?.provider_can_write_authoritative_world_state === false && entry.authority?.provider_can_commit === false && entry.authority?.rcl_promotion_authorized === false),
    incomplete_external_authority_explicit: matrix?.summary?.aaa_release_status === 'BLOCKED_EXTERNAL_ART_HUMAN_HARDWARE_EVIDENCE' && matrix?.summary?.ai_generate_status === 'BLOCKED_NOT_RUN',
    candidate_only: true
  };
}

export function createURRFIntegrationCourtVerdict({matrix = createURRFV03CoverageMatrix(), gapLedger} = {}) {
  const checks = courtChecks(matrix, gapLedger);
  const verdict = {
    format: URRF_INTEGRATION_COURT_FORMAT,
    version: URRF_GAP_LEDGER_VERSION,
    court_id: 'urrf-v03-integration-court-v01',
    coverage_root: matrix?.coverage_root ?? null,
    gap_ledger_root: gapLedger?.ledger_root ?? null,
    checks,
    status: Object.values(checks).every(Boolean) ? 'CANDIDATE_LOCAL_ONLY' : 'BLOCKED_INCOMPLETE_GAP_COURT',
    decision: 'NO_RCL_PROMOTION_OR_CANONICAL_WRITE',
    external_authorization_status: 'NOT_PRESENT',
    authority: authorityBoundary(),
    court_root: ''
  };
  return rooted(verdict, 'court_root');
}

export function verifyURRFIntegrationCourtVerdict(verdict, {matrix = null, gapLedger = null} = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!verdict || typeof verdict !== 'object' || Array.isArray(verdict)) return {valid: false, errors: ['INTEGRATION_COURT_NOT_OBJECT'], court_root: null};
  check(verdict.format === URRF_INTEGRATION_COURT_FORMAT, 'INTEGRATION_COURT_FORMAT_INVALID');
  check(verdict.version === URRF_GAP_LEDGER_VERSION, 'INTEGRATION_COURT_VERSION_INVALID');
  check(text(verdict.court_id), 'INTEGRATION_COURT_ID_INVALID');
  check(verdict.decision === 'NO_RCL_PROMOTION_OR_CANONICAL_WRITE', 'INTEGRATION_COURT_DECISION_INVALID');
  check(verdict.external_authorization_status === 'NOT_PRESENT', 'INTEGRATION_COURT_EXTERNAL_AUTHORITY_INVALID');
  check(verdict.authority?.canonical_owner === 'RNCS' && verdict.authority?.semantic_owner === 'RCL' && verdict.authority?.representation_owner === 'URRF', 'INTEGRATION_COURT_AUTHORITY_OWNER_INVALID');
  check(verdict.authority?.provider_can_write_authoritative_world_state === false && verdict.authority?.provider_can_commit === false && verdict.authority?.rcl_promotion_authorized === false && verdict.authority?.canonical_write_authorized === false && verdict.authority?.candidate_only === true, 'INTEGRATION_COURT_AUTHORITY_ESCALATION');
  if (matrix !== null && gapLedger !== null) {
    check(verdict.coverage_root === matrix.coverage_root, 'INTEGRATION_COURT_COVERAGE_BINDING_INVALID');
    check(verdict.gap_ledger_root === gapLedger.ledger_root, 'INTEGRATION_COURT_GAP_LEDGER_BINDING_INVALID');
    const expectedChecks = courtChecks(matrix, gapLedger);
    check(rootHash(verdict.checks ?? {}) === rootHash(expectedChecks), 'INTEGRATION_COURT_CHECKS_MISMATCH');
    check(verdict.status === (Object.values(expectedChecks).every(Boolean) ? 'CANDIDATE_LOCAL_ONLY' : 'BLOCKED_INCOMPLETE_GAP_COURT'), 'INTEGRATION_COURT_STATUS_MISMATCH');
  }
  try {
    check(root(verdict.court_root) && rootHash(without(verdict, 'court_root')) === verdict.court_root, 'INTEGRATION_COURT_ROOT_INVALID');
  } catch (error) {
    errors.push(`INTEGRATION_COURT_ROOT_EXCEPTION:${error.code ?? error.message}`);
  }
  return {valid: errors.length === 0, errors, court_root: verdict.court_root ?? null};
}
