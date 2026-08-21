import {clone, GenesisError, rootHash, seal, stableId} from './canonical.mjs';

export const LAF_ASSET_BINDING_FORMAT = 'ragf.laf-asset-binding-candidate.v0.1';

export function createLAFAssetPackageCandidate({candidate, court, livingAssetFamily, evidenceLedger = null} = {}) {
  if (!candidate?.candidate_root || !court?.court_root || !livingAssetFamily?.family_root) {
    throw new GenesisError('LAF_BINDING_INPUT_REQUIRED');
  }
  if (!court.pass) throw new GenesisError('LAF_BINDING_COURT_FAILED', (court.failures ?? []).join(','));
  const files = (candidate.files ?? []).map(file => ({
    path: 'assets/' + String(file.path ?? file.name),
    media_type: file.mime ?? file.format ?? 'application/octet-stream',
    size: Number(file.size ?? 0),
    sha256: file.sha256
  }));
  const contentRoot = rootHash(files);
  const lafPackageCandidate = {
    format: 'laf.package.v1',
    package_version: '1.0.0',
    artifact_id: stableId('artifact:asset', candidate.asset_id),
    artifact_root: candidate.candidate_root,
    entrypoint: 'asset-candidate.json',
    files,
    content_root: contentRoot,
    signature: null,
    source_kind: 'ragf.asset-candidate',
    binding_status: 'candidate'
  };
  return seal({
    format: LAF_ASSET_BINDING_FORMAT,
    version: '0.1.0',
    binding_id: stableId('laf-asset-binding', {candidate: candidate.candidate_root, family: livingAssetFamily.family_root}),
    laf_target: 'laf.package.v1',
    laf_package_candidate: lafPackageCandidate,
    asset_id: candidate.asset_id,
    candidate_root: candidate.candidate_root,
    court_root: court.court_root,
    family_root: livingAssetFamily.family_root,
    evidence_ledger_root: evidenceLedger?.ledger_root ?? null,
    provider_roots: [candidate.provider_root].filter(Boolean),
    authority: {
      provider_can_bind_authoritative_laf: false,
      laf_runtime_validation_required: true,
      rncs_commit_required: true
    },
    status: 'CANDIDATE_FOR_LAF_BINDING',
    binding_root: ''
  }, 'binding_root');
}

export function validateLAFAssetPackageCandidate(binding) {
  const errors = [];
  if (binding?.format !== LAF_ASSET_BINDING_FORMAT) errors.push('FORMAT_INVALID');
  if (binding?.authority?.provider_can_bind_authoritative_laf) errors.push('PROVIDER_AUTHORITY_ESCALATION');
  if (binding?.laf_package_candidate?.format !== 'laf.package.v1') errors.push('LAF_PACKAGE_FORMAT_INVALID');
  if (binding?.laf_package_candidate?.artifact_root !== binding?.candidate_root) errors.push('LAF_ARTIFACT_ROOT_MISMATCH');
  const files = binding?.laf_package_candidate?.files ?? [];
  if (binding?.laf_package_candidate?.content_root !== rootHash(files)) errors.push('LAF_CONTENT_ROOT_MISMATCH');
  const copy = clone(binding ?? {});
  const actual = copy.binding_root;
  delete copy.binding_root;
  if (actual !== rootHash(copy)) errors.push('LAF_BINDING_ROOT_INVALID');
  return {valid: errors.length === 0, errors};
}

