import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(fs.readFileSync(new URL('../RCL-UPSTREAM.json', import.meta.url), 'utf8'));
const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('embedded RCL declares one canonical upstream without byte-identity claims', () => {
  assert.equal(contract.format, 'rncs.rcl-upstream-contract.v1');
  assert.equal(contract.consumer.repository, 'xingxuling/RNCS-Unified-Platform-');
  assert.equal(contract.consumer.branch, 'main-95');
  assert.equal(contract.consumer.path, 'packages/languages/reality-computation-language');
  assert.equal(contract.consumer.package, packageJson.name);
  assert.equal(contract.consumer.packageVersion, packageJson.version);
  assert.equal(contract.upstream.repository, 'xingxuling/RCL');
  assert.equal(contract.upstream.branch, 'main');
  assert.equal(contract.upstream.package, '@taowind/rcl-reality-forge');
  assert.equal(contract.relation, 'embedded-extension-delta');
  assert.equal(contract.authority.canonicalLanguageSource, 'upstream');
  assert.equal(contract.authority.byteIdentityAllowed, false);
  assert.equal(contract.authority.nativeArtifactReuseAllowed, false);
});

test('RNCS extension and synchronization debt remain explicit', () => {
  assert.equal(contract.classification.status, 'partial-audit');
  assert.ok(contract.classification.rncsExtensionDelta.includes('src/rncs-*.mjs'));
  assert.ok(contract.classification.generatedEvidence.includes('evidence-*.json'));
  assert.ok(contract.classification.nativeArtifacts.includes('native/*.exe'));
  assert.equal(contract.synchronization.status, 'audit-required');
  assert.equal(contract.synchronization.syncRequired, true);
  assert.ok(contract.synchronization.requiredBeforeSync.includes('preserve RNCS extension delta'));
  assert.match(contract.synchronization.promotionGate, /no byte-identity/);
});
