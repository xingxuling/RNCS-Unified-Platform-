import {GenesisError, rootHash} from './canonical.mjs';
import {validateVisualCapabilityProfile} from './visual-capability-profile.mjs';

// Independent wire adapter, based on OPP public schemas and integrity contract.
// No OPP implementation is vendored. Pin records the source actually audited.
export const OPP_VISUAL_CONTRACT_REVISION = '168e55bd071fe63c24ee71cd43d1573770e884b2';
const BOUNDARY = 'Provider-declared visual capability only; no execution, identity authentication, visual quality verification, or canonical authority promotion.';
const fail = (ok, code) => { if (!ok) throw new GenesisError(code); };
const sort = values => [...values].sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));

function envelope(protocol, kind, id, issuedAt, manifest, profile, payload, extensions = {}) {
  const value = {
    format: 'taowind.opp.reality-envelope.v0.1', protocol,
    version: '0.1.0-candidate.1', kind, id, status: 'candidate', issuedAt,
    issuer: {id: manifest.id, type: 'service'}, payload,
    constraints: ['candidate-only', 'host-execution-consent-required', 'no-canonical-authority-promotion'],
    evidenceRefs: [`rncs:provider-manifest:${manifest.manifest_root}`, `rncs:visual-profile:${profile.profile_root}`],
    extensions: {oppContractRevision: OPP_VISUAL_CONTRACT_REVISION, ...extensions}
  };
  // This adapter emits only fixed ASCII object keys and strings/booleans/arrays
  // (no floating point values). Hence canonical.mjs matches OPP's sorted UTF-8
  // JSON exactly, without assuming JS/Python general numeric equivalence.
  function validStrings(node) {
    if (typeof node === 'string') {
      for (const ch of node) fail(ch.codePointAt(0) < 0xD800 || ch.codePointAt(0) > 0xDFFF, 'OPP_UNPAIRED_SURROGATE');
    } else if (Array.isArray(node)) node.forEach(validStrings);
    else if (node && typeof node === 'object') Object.values(node).forEach(validStrings);
  }
  validStrings(value);
  return {...value, integrity: {algorithm: 'sha256', contentRoot: rootHash(value)}};
}

/** Translate a verified local declaration into actual OPP RCP and RXP envelopes.
 * issuedAt is supplied by the caller so retries never invent a new issue time.
 * The output is protocol data, not an execution request or authenticated claim.
 */
export function toOppVisualCapabilities(manifest, profile, {issuedAt} = {}) {
  fail(validateVisualCapabilityProfile(profile, manifest).valid, 'OPP_VISUAL_PROFILE_INVALID');
  fail(typeof issuedAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(issuedAt), 'OPP_ISSUED_AT_INVALID');
  const parsed = new Date(issuedAt);
  fail(Number.isFinite(parsed.getTime()) && parsed.toISOString() === (issuedAt.includes('.') ? issuedAt : issuedAt.replace('Z', '.000Z')), 'OPP_ISSUED_AT_INVALID');
  const operations = [...profile.operations].sort((a, b) => Buffer.compare(Buffer.from(a.operation), Buffer.from(b.operation)));
  const rcp = operations.map(op => envelope('opp.rcp.v0.1', 'capability', `capability:visual:${profile.profile_root}:${op.operation}`, issuedAt, manifest, profile, {
    capabilityId: op.capability_id, name: `Visual ${op.operation}`, domain: 'visual.character', operation: op.operation,
    inputModalities: sort(op.input_formats), outputModalities: sort(op.output_formats),
    inputSchema: null, outputSchema: null,
    determinism: op.deterministic ? 'seeded' : 'unknown', statefulness: 'unknown',
    authorityRequired: ['host.execution.consent'], sideEffects: ['provider-defined:unknown'],
    reversibility: 'unknown', availability: 'candidate-only',
    evidence: [`rncs:visual-profile:${profile.profile_root}`], claimBoundary: BOUNDARY
  }, {representationKinds: sort(op.representation_kinds), providerVersion: manifest.version}));
  const rxp = envelope('opp.rxp.v0.1', 'protocol', `exchange:visual:${profile.profile_root}`, issuedAt, manifest, profile, {
    semanticClass: 'capability',
    content: {providerId: manifest.id, providerManifestRoot: manifest.manifest_root, visualProfileRoot: profile.profile_root,
      capabilities: rcp.map(item => ({id: item.id, protocol: item.protocol, contentRoot: item.integrity.contentRoot}))},
    intent: null, actions: [], rollback: null, authority: [], claimBoundary: BOUNDARY
  });
  return {rcp, rxp};
}
