import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RealityOneGateway } from '../src/index.mjs';

const root = path.resolve(import.meta.dirname, '..');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'rfe-verification-'));

test('Gateway RFE verify reports actual store integrity instead of unconditional success', async () => {
  const g = new RealityOneGateway({ manifestDirs: [path.join(root, 'runtimes')], dataDir: tmp() });
  await g.discover();
  const storeRoot = tmp();
  await g.invoke('rncs.rfe', 'init', { root: storeRoot, worldId: 'world:verify', branchId: 'branch:main' });
  const valid = await g.invoke('rncs.rfe', 'verify', { root: storeRoot });
  assert.equal(valid.valid, true);
  assert.equal(valid.generation_id !== null, true);

  const metadataPath = path.join(storeRoot, 'store.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  metadata.worldId = 'world:tampered';
  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  const invalid = await g.invoke('rncs.rfe', 'verify', { root: storeRoot });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.some(error => error.includes('RFE_STORE_METADATA_TAMPERED')));
});
