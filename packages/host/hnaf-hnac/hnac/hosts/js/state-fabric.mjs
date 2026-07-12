import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

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

export function sha256(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

export function computeStateRoot(appId, schemaVersion, partitions) {
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

export function verifyBundle(bundleOrPath) {
  const bundle = typeof bundleOrPath === 'string'
    ? JSON.parse(fs.readFileSync(bundleOrPath, 'utf8'))
    : bundleOrPath;
  if (bundle.format !== BUNDLE_FORMAT) throw new Error('Unsupported state bundle format');
  const { bundle_root: declared, created_utc: _created, ...core } = bundle;
  const actual = sha256(canonicalJson(core));
  if (declared !== actual) throw new Error('State bundle root mismatch');
  if (!bundle.partitions?.portable) throw new Error('State bundle must contain portable state');
  if (bundle.partitions.device_private || bundle.partitions.ephemeral) throw new Error('State bundle leaks local-only partitions');
  return bundle;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const [command, file] = process.argv.slice(2);
  if (command === 'verify') {
    const bundle = verifyBundle(file);
    console.log(JSON.stringify({ valid: true, bundle_root: bundle.bundle_root, app_id: bundle.app_id }, null, 2));
  } else if (command === 'root') {
    const input = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(computeStateRoot(input.app_id, input.schema_version, input.partitions));
  } else {
    throw new Error('Usage: state-fabric.mjs <verify|root> <file>');
  }
}
