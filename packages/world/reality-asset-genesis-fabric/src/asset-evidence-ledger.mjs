import {clone, rootHash, seal, stableId} from './canonical.mjs';

export const ASSET_EVIDENCE_LEDGER_FORMAT = 'ragf.asset-evidence-ledger.v0.1';

const entry = (id, status, root, details = {}) => ({
  evidence_id: id,
  status,
  root: root ?? rootHash({id, status, details}),
  details: clone(details)
});

export function createAssetEvidenceLedger({
  assetIntent = null,
  genome = null,
  requirement = null,
  provider = null,
  job = null,
  result = null,
  candidate = null,
  court = null,
  placement = null
} = {}) {
  const entries = [
    entry('asset-intent', assetIntent ? 'PASS' : 'NOT_PROVIDED', assetIntent?.intent_root, {intent_id: assetIntent?.intent_id ?? null}),
    entry('asset-genome', genome ? 'PASS' : 'NOT_PROVIDED', genome?.genome_root, {asset_id: genome?.identity?.asset_id ?? null}),
    entry('asset-requirement', requirement ? 'PASS' : 'NOT_PROVIDED', requirement?.requirement_root, {role: requirement?.role ?? null}),
    entry('provider-manifest', provider ? 'PASS' : 'NOT_PROVIDED', provider?.manifest_root, {provider_id: provider?.id ?? provider?.provider_id ?? null}),
    entry('job-lifecycle', job?.state === 'COMPLETED' ? 'PASS' : (job?.state ?? 'NOT_PROVIDED'), job?.job_root, {history: job?.history ?? []}),
    entry('provider-result', result?.result_root ? 'PASS' : 'NOT_PROVIDED', result?.result_root, {candidate_id: result?.candidate_id ?? null}),
    entry('candidate', candidate?.candidate_root ? 'PASS' : 'NOT_PROVIDED', candidate?.candidate_root, {candidate_only: candidate?.candidate_only ?? true}),
    entry('production-court', court?.pass ? 'PASS' : (court ? 'FAIL' : 'NOT_PROVIDED'), court?.court_root, {gates: court?.gates ?? null, failures: court?.failures ?? []}),
    entry('world-placement', placement?.status === 'READY_FOR_WORLD_COMMIT' ? 'PASS' : (placement ? placement.status : 'NOT_PROVIDED'), placement?.placement_root, {role: placement?.role ?? null})
  ];
  const failures = entries.filter(item => ['FAIL', 'FAILED'].includes(item.status)).map(item => item.evidence_id);
  return seal({
    format: ASSET_EVIDENCE_LEDGER_FORMAT,
    version: '0.1.0',
    ledger_id: stableId('asset-evidence-ledger', {
      intent_root: assetIntent?.intent_root ?? null,
      genome_root: genome?.genome_root ?? null,
      requirement_root: requirement?.requirement_root ?? null,
      result_root: result?.result_root ?? null,
      court_root: court?.court_root ?? null,
      placement_root: placement?.placement_root ?? null
    }),
    authority: {
      provider_is_candidate_source_only: true,
      provider_can_write_authoritative_world_state: false,
      rncs_commit_required: true
    },
    entries,
    status: failures.length ? 'FAIL' : 'RECORDED',
    failures,
    roots: {
      provider_root: provider?.manifest_root ?? null,
      job_root: job?.job_root ?? null,
      result_root: result?.result_root ?? null,
      candidate_root: candidate?.candidate_root ?? null,
      court_root: court?.court_root ?? null,
      placement_root: placement?.placement_root ?? null
    },
    ledger_root: ''
  }, 'ledger_root');
}

export function verifyAssetEvidenceLedger(ledger) {
  const errors = [];
  if (ledger?.format !== ASSET_EVIDENCE_LEDGER_FORMAT) errors.push('FORMAT_INVALID');
  if (!ledger?.ledger_root || ledger.ledger_root !== rootHash({...ledger, ledger_root: undefined})) {
    const copy = clone(ledger ?? {});
    const actual = copy.ledger_root;
    delete copy.ledger_root;
    if (actual !== rootHash(copy)) errors.push('LEDGER_ROOT_INVALID');
  }
  if (ledger?.authority?.provider_can_write_authoritative_world_state) errors.push('PROVIDER_AUTHORITY_ESCALATION');
  if (ledger?.entries?.some(item => !item.evidence_id || !item.status || !item.root)) errors.push('EVIDENCE_ENTRY_INVALID');
  return {valid: errors.length === 0, errors};
}

