import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createAssetProviderManifest} from '../src/asset-provider-contract.mjs';
import {createVisualCapabilityProfile, VISUAL_OPERATIONS} from '../src/visual-capability-profile.mjs';
import {toOppVisualCapabilities, OPP_VISUAL_CONTRACT_REVISION} from '../src/visual-opp-bridge.mjs';
import {rootHash} from '../src/canonical.mjs';

const issuedAt = '2026-09-08T00:00:00Z';
function fixture(id = 'provider:视觉:😀') {
  const manifest = createAssetProviderManifest({id, version: '1', capabilities: VISUAL_OPERATIONS.map(v => 'visual.' + v), inputFormats: ['ragf.visual-ir.v0.1'], outputFormats: ['ragf.visual-ir.v0.1'], representation: {kinds: ['character-mesh', 'layered-2d']}, license: 'Apache-2.0'});
  const profile = createVisualCapabilityProfile(manifest, {operations: VISUAL_OPERATIONS.map(operation => ({operation, capability_id: 'visual.' + operation, input_formats: manifest.inputFormats, output_formats: manifest.outputFormats, representation_kinds: manifest.representation.kinds, deterministic: operation !== 'denoising'}))});
  return {manifest, profile};
}

test('actual OPP wire envelopes preserve declarations and do not grant execution authority', () => {
  const {manifest, profile} = fixture();
  const before = structuredClone({manifest, profile});
  const output = toOppVisualCapabilities(manifest, profile, {issuedAt});
  assert.deepEqual({manifest, profile}, before);
  assert.deepEqual(toOppVisualCapabilities(manifest, profile, {issuedAt}), output);
  assert.equal(output.rcp.length, 6);
  for (const item of [...output.rcp, output.rxp]) {
    assert.equal(item.format, 'taowind.opp.reality-envelope.v0.1');
    assert.equal(item.extensions.oppContractRevision, OPP_VISUAL_CONTRACT_REVISION);
    const {integrity, ...unsigned} = item;
    assert.equal(integrity.contentRoot, rootHash(unsigned));
    assert.equal(item.status, 'candidate');
  }
  assert.equal(output.rcp.find(v => v.payload.operation === 'denoising').payload.determinism, 'unknown');
  assert.equal(output.rcp.find(v => v.payload.operation === 'modeling').payload.determinism, 'seeded');
  assert.ok(output.rcp.every(v => v.payload.availability === 'candidate-only'));
  assert.deepEqual(output.rxp.payload.actions, []);
  assert.deepEqual(output.rxp.payload.authority, []);
  assert.deepEqual(output.rxp.payload.content.capabilities.map(v => v.contentRoot), output.rcp.map(v => v.integrity.contentRoot));
});

test('stale profile, missing or impossible issue times, and invalid UTF-8 strings reject', () => {
  const {manifest, profile} = fixture();
  assert.throws(() => toOppVisualCapabilities({...manifest, id: 'other'}, profile, {issuedAt}), /PROFILE_INVALID/);
  for (const time of [undefined, '', 'today', '2026-02-30T00:00:00Z']) assert.throws(() => toOppVisualCapabilities(manifest, profile, {issuedAt: time}), /ISSUED_AT_INVALID/);
  const invalid = fixture('provider:\uD800');
  assert.throws(() => toOppVisualCapabilities(invalid.manifest, invalid.profile, {issuedAt}), /UNPAIRED_SURROGATE/);
});

test('actual OPP Python schema and integrity validator accepts Unicode envelopes and rejects tampering', {skip: !process.env.OPP_SOURCE_ROOT}, () => {
  const {manifest, profile} = fixture();
  const {rcp, rxp} = toOppVisualCapabilities(manifest, profile, {issuedAt});
  const script = `import sys,json,pathlib\nsys.path.insert(0,str(pathlib.Path(sys.argv[1])/'src'))\nfrom opp.validation import validate_envelope\nitems=json.loads(sys.stdin.buffer.read().decode('utf-8'))\nfor envelope in items:\n issues=validate_envelope(envelope)\n assert not issues, str(issues)\n envelope['id']+=':tampered'\n assert any(i.code=='INTEGRITY_ROOT_MISMATCH' for i in validate_envelope(envelope))\nprint(json.dumps({'accepted':len(items),'tamper_rejected':len(items)}))`;
  const check = spawnSync(process.env.OPP_PYTHON ?? 'python', ['-I', '-B', '-c', script, process.env.OPP_SOURCE_ROOT], {input: JSON.stringify([...rcp, rxp]), encoding: 'utf8', timeout: 30000});
  assert.equal(check.status, 0, check.stderr || check.error?.message);
  assert.deepEqual(JSON.parse(check.stdout), {accepted: 7, tamper_rejected: 7});
});
