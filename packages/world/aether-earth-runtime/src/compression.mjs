import zlib from 'node:zlib';
import { canonicalJson, realityRoot } from './canonical.mjs';

export function compressReality(value) {
  const json = canonicalJson(value);
  const original = Buffer.from(json, 'utf8');
  const compressed = zlib.deflateRawSync(original, { level: 9 });
  return {
    format: 'aether-earth.reality-capsule.v0.1',
    codec: 'deflate-raw',
    reversible: true,
    originalBytes: original.length,
    compressedBytes: compressed.length,
    ratio: Number((compressed.length / Math.max(1, original.length)).toFixed(6)),
    realityRoot: realityRoot(value),
    payloadBase64: compressed.toString('base64'),
  };
}

export function restoreReality(capsule) {
  if (!capsule || capsule.codec !== 'deflate-raw' || capsule.reversible !== true) {
    throw new TypeError('unsupported reality capsule');
  }
  const json = zlib.inflateRawSync(Buffer.from(capsule.payloadBase64, 'base64')).toString('utf8');
  const value = JSON.parse(json);
  const restoredRoot = realityRoot(value);
  if (restoredRoot !== capsule.realityRoot) throw new Error('restored reality root mismatch');
  return value;
}

export function compactHistory(events) {
  const counts = {};
  let firstDay = null;
  let lastDay = null;
  for (const event of events) {
    counts[event.type] = (counts[event.type] ?? 0) + 1;
    if (Number.isFinite(event.day)) {
      firstDay = firstDay == null ? event.day : Math.min(firstDay, event.day);
      lastDay = lastDay == null ? event.day : Math.max(lastDay, event.day);
    }
  }
  return { eventCount: events.length, counts, firstDay, lastDay };
}
