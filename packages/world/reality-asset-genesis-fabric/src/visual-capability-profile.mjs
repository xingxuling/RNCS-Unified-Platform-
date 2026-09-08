import {clone, GenesisError, seal, verifySeal} from './canonical.mjs';
import {validateAssetProviderManifest} from './asset-provider-contract.mjs';

// OPP6-facing candidate extension; the existing RAGF manifest remains provider identity owner.
export const VISUAL_OPERATIONS = Object.freeze(['modeling', 'material', 'layering', 'rigging', 'rendering', 'denoising']);
const fail = (ok, code) => { if (!ok) throw new GenesisError(code); };
export function createVisualCapabilityProfile(manifest, input) {
  fail(validateAssetProviderManifest(manifest).valid, 'VISUAL_PROVIDER_INVALID');
  const profile = seal({
    format: 'ragf.opp6-visual-capability-profile.v0.1',
    protocol_status: 'CANDIDATE_EXTENSION',
    provider_id: manifest.id, provider_manifest_root: manifest.manifest_root,
    candidate_only: true, operations: clone(input.operations),
  }, 'profile_root');
  const report = validateVisualCapabilityProfile(profile, manifest);
  fail(report.valid, report.errors.join(','));
  return profile;
}
export function validateVisualCapabilityProfile(profile, manifest) {
  const errors = [];
  const check = (ok, code) => { if (!ok) errors.push(code); };
  try {
    check(validateAssetProviderManifest(manifest).valid, 'VISUAL_PROVIDER_INVALID');
    check(profile?.format === 'ragf.opp6-visual-capability-profile.v0.1' && profile.protocol_status === 'CANDIDATE_EXTENSION', 'VISUAL_PROFILE_FORMAT');
    check(profile.candidate_only === true, 'VISUAL_PROFILE_AUTHORITY');
    check(profile.provider_id === manifest.id && profile.provider_manifest_root === manifest.manifest_root, 'VISUAL_PROFILE_PROVIDER_BINDING');
    check(verifySeal(profile, 'profile_root'), 'VISUAL_PROFILE_ROOT');
    check(Array.isArray(profile.operations) && profile.operations.length > 0, 'VISUAL_OPERATIONS_REQUIRED');
    const seen = new Set();
    for (const op of profile.operations ?? []) {
      check(VISUAL_OPERATIONS.includes(op.operation) && !seen.has(op.operation), 'VISUAL_OPERATION_INVALID'); seen.add(op.operation);
      check(manifest.capabilities.includes(op.capability_id), 'VISUAL_CAPABILITY_UNDECLARED');
      for (const [field, allowed] of [['input_formats', manifest.inputFormats], ['output_formats', manifest.outputFormats], ['representation_kinds', manifest.representation?.kinds ?? []]]) {
        check(Array.isArray(op[field]) && op[field].length > 0 && new Set(op[field]).size === op[field].length && op[field].every(v => typeof v === 'string' && allowed.includes(v)), 'VISUAL_' + field.toUpperCase());
      }
      check(typeof op.deterministic === 'boolean', 'VISUAL_DETERMINISM_DECLARATION');
    }
  } catch { errors.push('VISUAL_PROFILE_MALFORMED'); }
  return {valid: errors.length === 0, errors};
}
