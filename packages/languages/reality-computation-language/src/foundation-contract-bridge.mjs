const freeze = value => Object.freeze(value);

export const FOUNDATION_CONTRACT_FORMAT = 'taowind.rcl-foundation-contract.v0.1';
export const FOUNDATION_CONTRACT_VERSION = '0.1.0';
export const FOUNDATION_MANIFEST_ROOT = '34e508fe3b6587e630cc32a075edbad87323c7359434b2a2aaf01cf7e250f7e1';

export const FOUNDATION_DOMAINS = freeze([
  'metacomputation',
  'computation',
  'physical',
  'energy',
  'elemental',
  'perception',
  'neural',
  'embodiment',
  'life',
  'genetic',
  'quantitative',
  'knowledge',
  'scientific',
  'spiritual',
]);

export const FOUNDATION_COMPOSITE_PLANES = freeze([
  'natural-language-reality',
  'understanding-reality',
  'creative-reality',
  'inner-reality',
  'execution-reality',
]);

export const FOUNDATION_META_PLANES = freeze([
  'meta-spacetime',
  'meta-acceleration',
  'meta-compression',
]);

export const FOUNDATION_CROSS_DOMAIN_AXES = freeze([
  'authority-boundary',
  'causality-evidence',
]);

export const FOUNDATION_4R_FIELDS = freeze([
  'explicitVariables',
  'providerCapabilities',
  'authorityRequirements',
  'evidenceRequirements',
]);

export const FOUNDATION_CONTRACT_PROVENANCE = freeze({
  repository: 'xingxuling/RCL',
  branch: 'main',
  canonicalPath: 'src/foundation-contract.mjs',
  integrationMode: 'bridge',
  byteIdentityClaimed: false,
  downstreamDelta: true,
});

export function foundationContractSummary() {
  return {
    format: FOUNDATION_CONTRACT_FORMAT,
    version: FOUNDATION_CONTRACT_VERSION,
    manifestRoot: FOUNDATION_MANIFEST_ROOT,
    counts: {
      domains: FOUNDATION_DOMAINS.length,
      compositePlanes: FOUNDATION_COMPOSITE_PLANES.length,
      metaPlanes: FOUNDATION_META_PLANES.length,
      crossDomainAxes: FOUNDATION_CROSS_DOMAIN_AXES.length,
      fourR: FOUNDATION_4R_FIELDS.length,
    },
    provenance: FOUNDATION_CONTRACT_PROVENANCE,
  };
}
