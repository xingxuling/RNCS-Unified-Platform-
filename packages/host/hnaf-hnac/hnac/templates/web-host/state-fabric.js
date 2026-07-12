export const STATE_FORMAT = 'hnaf.portable-state.v0.5';
export const BUNDLE_FORMAT = 'hnaf.state-bundle.v0.5';

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export async function sha256(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, '0')).join('');
}

export async function computeStateRoot(appId, schemaVersion, partitions) {
  const normalized = Object.fromEntries(
    Object.keys(partitions)
      .filter((name) => name !== 'ephemeral')
      .sort()
      .map((name) => [name, canonicalize(partitions[name] ?? {})]),
  );
  return sha256(canonicalJson({
    format: STATE_FORMAT,
    app_id: String(appId),
    schema_version: String(schemaVersion),
    partitions: normalized,
  }));
}

export async function verifyBundle(bundle) {
  if (bundle.format !== BUNDLE_FORMAT) throw new Error('Unsupported state bundle format');
  const { bundle_root: declared, created_utc: _created, ...core } = bundle;
  const actual = await sha256(canonicalJson(core));
  if (declared !== actual) throw new Error('State bundle root mismatch');
  if (!bundle.partitions?.portable) throw new Error('State bundle must contain portable state');
  if (bundle.partitions.device_private || bundle.partitions.ephemeral) throw new Error('State bundle leaks local-only partitions');
  return bundle;
}
