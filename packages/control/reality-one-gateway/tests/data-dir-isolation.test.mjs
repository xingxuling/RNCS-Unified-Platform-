import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RealityOneGateway } from '../src/index.mjs';

const root = path.resolve(import.meta.dirname, '..');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'gateway-data-isolation-'));

test('Gateway dataDir isolates the shared RCL and Aetherworld authority store', async () => {
  const first = new RealityOneGateway({ manifestDirs: [path.join(root, 'runtimes')], dataDir: tmp() });
  await first.discover();
  const before = await first.invoke('rncs.aetherworld-native', 'worldStatus', {});
  const committed = await first.invoke('rncs.rcl-control', 'authorityWorkflow', {
    source: 'reality IsolatedRclWorld { facet rncs.world.world_id : Text = "world:isolation-a" facet rncs.world.title : Text = "isolated" }',
    commit: true,
    approvalRoles: ['owner', 'security'],
    expectedStateRoot: before.state_root,
    expectedRevision: before.revision,
  }, { timeoutMs: 120000 });
  assert.equal(committed.status, 'committed');

  const second = new RealityOneGateway({ manifestDirs: [path.join(root, 'runtimes')], dataDir: tmp() });
  await second.discover();
  const isolated = await second.invoke('rncs.aetherworld-native', 'worldStatus', {});
  assert.equal(isolated.world_id, 'world:empty');
  assert.equal(isolated.revision, 1);
  assert.notEqual(isolated.state_root, committed.after.state_root);
});
